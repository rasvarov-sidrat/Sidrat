import { useTranslation } from 'react-i18next';

export function AdminProducts() {
  const { t } = useTranslation();
  return (
    <div className="pt-24 container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-4">{t('admin.products')}</h1>
      <p>Управление товарами</p>
    </div>
  );
}