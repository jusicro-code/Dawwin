import { ContentPage } from '@/components/ContentPage';
export default function Page() {
  return <ContentPage
    ar={{ title: 'سياسة الإرجاع والاسترداد', body: <><p>نظراً لطبيعة المنتجات (مواشٍ حية أو لحوم مجهزة)، يتم التعامل مع طلبات الإرجاع حالة بحالة بالتواصل مع المتجر قبل أو عند التسليم.</p><p>عند إلغاء الطلب قبل التجهيز أو تعذر توفيره، يتم استرداد المبلغ المدفوع إلى وسيلة الدفع الأصلية، مع إصدار إشعار دائن.</p></> }}
    en={{ title: 'Returns & refunds', body: <><p>Given the nature of the products (live animals or prepared meat), return requests are handled case by case by contacting the store before or at delivery.</p><p>If an order is cancelled before preparation or cannot be fulfilled, the amount paid is refunded to the original payment method and a credit note is issued.</p></> }} />;
}
