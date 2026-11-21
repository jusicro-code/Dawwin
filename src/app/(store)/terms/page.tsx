import { ContentPage } from '@/components/ContentPage';
export default function Page() {
  return <ContentPage
    ar={{ title: 'الشروط والأحكام', body: <><p>الأسعار معروضة بالريال السعودي للرأس الواحد، ويتم احتساب الإجمالي النهائي من خوادم المتجر عند إتمام الطلب.</p><p>لا يُعتبر الطلب مدفوعاً إلا بعد التحقق من الدفع من خوادمنا لدى مزود الدفع.</p><p>خدمات الذبح والتجهيز متاحة فقط عند تفعيلها من المتجر.</p><p>يحق للمتجر رفض أو إلغاء الطلب عند عدم توفر المخزون، مع استرداد أي مبلغ مدفوع.</p></> }}
    en={{ title: 'Terms & conditions', body: <><p>Prices are in Saudi Riyals per head; the final total is calculated by the store&apos;s servers at checkout.</p><p>An order is considered paid only after the payment is verified server-side with the payment provider.</p><p>Slaughter and preparation services are available only when enabled by the store.</p><p>The store may reject or cancel an order when stock is unavailable, refunding any amount paid.</p></> }} />;
}
