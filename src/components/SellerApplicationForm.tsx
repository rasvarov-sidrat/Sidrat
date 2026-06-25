import { type FormEvent, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SellerApplicationForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/api/v1/seller-applications', {
        method: 'POST',
        body: JSON.stringify({
          email,
          name,
          companyName,
          phone,
          message,
        }),
      });
      toast({ title: 'Заявка отправлена', description: 'Мы сохранили seller-заявку и передали её на рассмотрение.' });
      setEmail('');
      setName('');
      setCompanyName('');
      setPhone('');
      setMessage('');
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Не удалось отправить заявку';
      toast({ title: 'Ошибка', description: detail, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="seller-application" onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-[#2A7F6E]/15 bg-[#2A7F6E]/5 p-4">
      <div>
        <h4 className="font-medium text-gray-900 mb-1">Стать продавцом</h4>
        <p className="text-xs text-gray-600">Оставьте заявку, и админ подтвердит доступ вручную.</p>
      </div>
      <div>
        <Label htmlFor="seller-email" className="text-xs">Email</Label>
        <Input id="seller-email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-9" type="email" placeholder="brand@example.com" />
      </div>
      <div>
        <Label htmlFor="seller-name" className="text-xs">Имя</Label>
        <Input id="seller-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-9" placeholder="Имя и фамилия" />
      </div>
      <div>
        <Label htmlFor="seller-company" className="text-xs">Компания</Label>
        <Input id="seller-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 h-9" placeholder="ООО / бренд" />
      </div>
      <div>
        <Label htmlFor="seller-phone" className="text-xs">Телефон</Label>
        <Input id="seller-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 h-9" placeholder="+7..." />
      </div>
      <div>
        <Label htmlFor="seller-message" className="text-xs">Комментарий</Label>
        <Input id="seller-message" value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 h-9" placeholder="Коротко о запросе" />
      </div>
      <Button type="submit" size="sm" className="w-full bg-[#2A7F6E] text-white hover:bg-[#236b5d]" disabled={loading}>
        Отправить заявку
      </Button>
    </form>
  );
}
