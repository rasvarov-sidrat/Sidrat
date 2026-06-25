import SellerApplicationForm from '@/components/SellerApplicationForm';

export default function SellerApplication() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">Seller onboarding</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Подать заявку продавца</h1>
        <p className="mt-2 text-gray-600">
          Если хочешь запускать GB-сессии, оставь заявку здесь. Админ рассмотрит её вручную и даст доступ после проверки.
        </p>
      </div>

      <SellerApplicationForm />
    </div>
  );
}
