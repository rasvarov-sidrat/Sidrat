import { useTranslation } from 'react-i18next';

export function AdminSettings() {
  const { t } = useTranslation();
  return (
    <div className="pt-24 container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-4">{t('admin.settings')}</h1>
      <p>Настройки платформы</p>
    </div>
  );
}