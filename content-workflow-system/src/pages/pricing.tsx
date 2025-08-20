import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PaymentDialog } from '@/components/payment/PaymentDialog';
import { Check, Star, Zap, Crown } from 'lucide-react';

const pricingPlans = [
  {
    id: 'basic',
    name: '基础版',
    price: 29,
    description: '适合个人创作者',
    icon: <Zap className="h-6 w-6" />,
    features: [
      '每月100篇内容创作',
      '基础热点分析',
      '3个平台发布',
      '基础数据统计',
      '邮件支持'
    ],
    popular: false
  },
  {
    id: 'pro',
    name: '专业版',
    price: 99,
    description: '适合专业团队',
    icon: <Star className="h-6 w-6" />,
    features: [
      '每月500篇内容创作',
      '高级热点分析',
      '10个平台发布',
      '详细数据分析',
      'AI内容优化',
      '团队协作功能',
      '优先客服支持'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    name: '企业版',
    price: 299,
    description: '适合大型企业',
    icon: <Crown className="h-6 w-6" />,
    features: [
      '无限内容创作',
      '企业级热点分析',
      '无限平台发布',
      '高级数据洞察',
      'AI内容生成',
      '多团队管理',
      '自定义工作流',
      '专属客户经理',
      'API接口访问'
    ],
    popular: false
  }
];

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<typeof pricingPlans[0] | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const handleSelectPlan = (plan: typeof pricingPlans[0]) => {
    setSelectedPlan(plan);
    setPaymentDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">选择适合您的套餐</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          从个人创作者到企业团队，我们为不同规模的用户提供灵活的定价方案
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {pricingPlans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative transition-all duration-200 hover:shadow-lg ${
              plan.popular
                ? 'border-primary shadow-lg scale-105'
                : 'hover:border-primary/50'
            }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                最受欢迎
              </Badge>
            )}

            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className={`p-3 rounded-full ${
                  plan.popular ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {plan.icon}
                </div>
              </div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription className="text-base">{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">¥{plan.price}</span>
                <span className="text-muted-foreground">/月</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full ${
                  plan.popular
                    ? 'bg-primary hover:bg-primary/90'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
                size="lg"
              >
                {plan.popular ? '立即购买' : '选择套餐'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-8">常见问题</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">可以随时升级或降级套餐吗？</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                是的，您可以随时在设置页面中升级或降级您的套餐。升级立即生效，降级将在下个计费周期生效。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">支持哪些支付方式？</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                我们支持微信支付、支付宝等主流支付方式，确保您的支付安全便捷。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">有免费试用期吗？</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                新用户注册即可获得7天免费试用，体验所有专业版功能。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">如何获得技术支持？</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                我们提供邮件、在线客服等多种支持方式，企业版用户还享有专属客户经理服务。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedPlan && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          planData={selectedPlan}
          userId="current-user-id" // 这里应该从用户状态获取
        />
      )}
    </div>
  );
}