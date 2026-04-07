import { List, Euro, FileText, Users, BookOpen, Tag, MessageSquare, Shield, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserRole } from '@/hooks/useUserRole';
import { useImpersonation } from '@/contexts/ImpersonationContext';

export default function Settings() {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const { isImpersonating } = useImpersonation();
  
  const settingsSections = [
    ...(isAdmin && !isImpersonating ? [{
      icon: Shield,
      title: 'Admin Panel',
      description: 'Gestisci utenti e permessi',
      path: '/admin',
    }] : []),
    {
      icon: BookOpen,
      title: 'Book Personali',
      description: 'Configura i tuoi book personali',
      path: '/impostazioni/books',
    },
    {
      icon: Database,
      title: 'Import/Export',
      description: 'Esporta o importa tutti i tuoi dati',
      path: '/impostazioni/import-export',
    },
    {
      icon: Users,
      title: 'Intestatari',
      description: 'Gestisci gli intestatari dei conti',
      path: '/impostazioni/intestatari',
    },
    {
      icon: Euro,
      title: 'Redditometro',
      description: 'Configura il redditometro e i calcoli fiscali',
      path: '/impostazioni/redditometro',
    },
    {
      icon: FileText,
      title: 'Report',
      description: 'Personalizza i report e le statistiche',
      path: '/impostazioni/report',
    },
    {
      icon: Tag,
      title: 'Tag Personali',
      description: 'Gestisci i tag personalizzati',
      path: '/impostazioni/tags',
    },
    {
      icon: MessageSquare,
      title: 'Telegram',
      description: 'Configura il tuo BOT Telegram per ricevere notifiche',
      path: '/impostazioni/telegram',
    },
    {
      icon: List,
      title: 'Transazioni',
      description: 'Gestisci le impostazioni delle transazioni',
      path: '/impostazioni/transazioni',
    },
  ];

  const handleCardClick = (path?: string) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-foreground">Impostazioni</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <Card 
              key={index} 
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
              onClick={() => handleCardClick(section.path)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
