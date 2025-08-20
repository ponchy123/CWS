import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { paymentService, PaymentMethod, CreateOrderRequest } from '@/services/payment';
import { Loader2, CheckCircle, XCircle, QrCode, CreditCard } from 'lucide-react';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planData: {
    name: string;
    price: number;
    description: string;
    features: string[];
  };
  userId: string;
}

export function PaymentDialog({ open, onOpenChange, planData, userId }: PaymentDialogProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'paying' | 'success' | 'failed'>('select');
  const [qrCode, setQrCode] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [countdown, setCountdown] = useState(300); // 5分钟倒计时
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadPaymentMethods();
      setPaymentStep('select');
      setCountdown(300);
    }
  }, [open]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (paymentStep === 'paying' && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setPaymentStep('failed');
      toast({
        title: '支付超时',
        description: '支付已超时，请重新发起支付',
        variant: 'destructive',
      });
    }
    return () => clearTimeout(timer);
  }, [paymentStep, countdown, toast]);

  const loadPaymentMethods = async () => {
    try {
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods.filter(m => m.enabled));
      if (methods.length > 0) {
        setSelectedMethod(methods[0].id);
      }
    } catch (error) {
      toast({
        title: '加载支付方式失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast({
        title: '请选择支付方式',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const orderData: CreateOrderRequest = {
        amount: planData.price,
        description: `购买${planData.name}套餐`,
        paymentMethod: selectedMethod,
        userId,
        planType: planData.name,
      };

      const result = await paymentService.createOrder(orderData);
      setOrderId(result.orderId);
      setQrCode(result.qrCode || '');
      setPaymentStep('paying');

      // 开始轮询支付状态
      try {
        await paymentService.pollOrderStatus(result.orderId);
        setPaymentStep('success');
        toast({
          title: '支付成功',
          description: '套餐已激活，感谢您的购买！',
        });
      } catch (error) {
        setPaymentStep('failed');
        toast({
          title: '支付失败',
          description: error instanceof Error ? error.message : '支付过程中出现错误',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setPaymentStep('failed');
      toast({
        title: '创建订单失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (paymentStep === 'paying' && orderId) {
      // 取消订单
      paymentService.cancelOrder(orderId).catch(console.error);
    }
    onOpenChange(false);
    setPaymentStep('select');
    setQrCode('');
    setOrderId('');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderPaymentStep = () => {
    switch (paymentStep) {
      case 'select':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">选择支付方式</h3>
              <div className="grid gap-3">
                {paymentMethods.map((method) => (
                  <Card
                    key={method.id}
                    className={`cursor-pointer transition-colors ${
                      selectedMethod === method.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <CardContent className="flex items-center space-x-3 p-4">
                      <div className="text-2xl">{method.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium">{method.name}</div>
                        <div className="text-sm text-muted-foreground">{method.description}</div>
                      </div>
                      {selectedMethod === method.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">订单详情</h3>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{planData.name}</span>
                    <Badge variant="secondary">套餐</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {planData.description}
                  </div>
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>总计</span>
                    <span className="text-primary">¥{planData.price}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button
              onClick={handlePayment}
              disabled={loading || !selectedMethod}
              className="w-full"
              size="lg"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              立即支付 ¥{planData.price}
            </Button>
          </div>
        );

      case 'paying':
        return (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <QrCode className="h-12 w-12 mx-auto text-primary" />
              <h3 className="text-lg font-semibold">请扫码支付</h3>
              <p className="text-sm text-muted-foreground">
                使用{paymentMethods.find(m => m.id === selectedMethod)?.name}扫描下方二维码完成支付
              </p>
            </div>

            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="支付二维码" className="w-48 h-48 border rounded-lg" />
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                剩余时间: {formatTime(countdown)}
              </div>
              <Progress value={(300 - countdown) / 300 * 100} className="w-full" />
            </div>

            <div className="text-xs text-muted-foreground">
              订单号: {orderId}
            </div>

            <Button variant="outline" onClick={handleClose} className="w-full">
              取消支付
            </Button>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <h3 className="text-lg font-semibold text-green-600">支付成功</h3>
              <p className="text-sm text-muted-foreground">
                恭喜您成功购买{planData.name}套餐！
              </p>
            </div>

            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span>套餐名称</span>
                  <span className="font-medium">{planData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>支付金额</span>
                  <span className="font-medium">¥{planData.price}</span>
                </div>
                <div className="flex justify-between">
                  <span>订单号</span>
                  <span className="font-medium text-xs">{orderId}</span>
                </div>
              </CardContent>
            </Card>

            <Button onClick={() => onOpenChange(false)} className="w-full">
              完成
            </Button>
          </div>
        );

      case 'failed':
        return (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <XCircle className="h-12 w-12 mx-auto text-red-500" />
              <h3 className="text-lg font-semibold text-red-600">支付失败</h3>
              <p className="text-sm text-muted-foreground">
                支付过程中出现问题，请重试或联系客服
              </p>
            </div>

            <div className="space-y-2">
              <Button onClick={() => setPaymentStep('select')} className="w-full">
                重新支付
              </Button>
              <Button variant="outline" onClick={handleClose} className="w-full">
                稍后再试
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>购买套餐</span>
          </DialogTitle>
          <DialogDescription>
            选择支付方式完成套餐购买
          </DialogDescription>
        </DialogHeader>

        {renderPaymentStep()}
      </DialogContent>
    </Dialog>
  );
}