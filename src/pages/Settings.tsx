import { Wrench, List, Euro, FileText, Users, BookOpen, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Settings() {
  const navigate = useNavigate();

  const settingsSections = [
    {
      icon: Wrench,
      title: 'Impostazioni Generali',
      description: 'Configura le impostazioni generali dell\'applicazione',
      path: '/impostazioni/generali',
    },
    {
      icon: List,
      title: 'Transazioni',
      description: 'Gestisci le impostazioni delle transazioni',
      path: '/impostazioni/transazioni',
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
      icon: Users,
      title: 'Intestatari',
      description: 'Gestisci gli intestatari dei conti',
    },
    {
      icon: BookOpen,
      title: 'Book Personali',
      description: 'Configura i tuoi book personali',
    },
    {
      icon: Tag,
      title: 'Tag Personali',
      description: 'Gestisci i tag personalizzati',
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

      <Separator className="my-8" />

      <Card>
        <CardHeader>
          <CardTitle>Informazioni Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Versione:</span>
            <span className="font-semibold">1.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ultimo aggiornamento:</span>
            <span className="font-semibold">Ottobre 2025</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
