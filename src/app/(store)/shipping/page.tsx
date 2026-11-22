import { ContentPage } from '@/components/ContentPage';
export default function Page() {
  return <ContentPage
    ar={{ title: 'سياسة التوصيل', body: <><p>التوصيل إلى عنوان العميل فقط، ولا يتوفر استلام من المتجر.</p><p>يختار العميل تاريخ وفترة التوصيل المتاحة عند إتمام الطلب، وتُحتسب رسوم التوصيل حسب منطقة التوصيل.</p><p>يتم إشعار العميل بتحديثات حالة الطلب ومعلومات المندوب.</p></> }}
    en={{ title: 'Delivery policy', body: <><p>Delivery to the customer&apos;s address only; there is no store pickup.</p><p>Customers choose an available delivery date and time slot at checkout; fees depend on the delivery zone.</p><p>Customers are notified of order status updates and driver details.</p></> }} />;
}
