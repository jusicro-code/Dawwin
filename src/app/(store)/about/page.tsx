import { ContentPage } from '@/components/ContentPage';
export default function About() {
  return <ContentPage
    ar={{ title: 'من نحن', body: <><p>متجر إلكتروني متخصص في بيع المواشي: خراف سواكني وحري، وتيوس، مع التوصيل إلى عنوان العميل.</p><p>نوفّر أسعاراً واضحة لكل رأس، وخيارات الذبح والتجهيز عند تفعيلها من المتجر، وفاتورة تفصيلية لكل طلب.</p><p>التوصيل إلى المنازل فقط، ولا يوجد استلام من المتجر.</p></> }}
    en={{ title: 'About us', body: <><p>An online store specialised in livestock: Sawakni and Harri sheep and male goats, delivered to the customer&apos;s address.</p><p>Clear per-head prices, slaughter and preparation options when enabled by the store, and a detailed invoice for every order.</p><p>Home delivery only — there is no store pickup.</p></> }} />;
}
