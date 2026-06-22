import { useTranslation } from 'react-i18next';

export function AdminSessions() {
  const { t } = useTranslation();
  return (
    <div className="pt-24 container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-4">{t('admin.sessions')}</h1>
      <p>Управление групповыми сессиями</p>
    </div>
  );
}