import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { UsersTable } from "@/components/dashboard/UsersTable";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { VerificationRequests } from "@/components/dashboard/VerificationRequests";
import { ReportManagement } from "@/components/dashboard/ReportManagement";
import { Card } from "@/components/ui/card";
import { Users, UserCheck, UserPlus, Eye } from "lucide-react";
import { ChatViewer } from "../components/dashboard/ChatViewer";
import { getAuth } from "firebase/auth";
import { db } from "../lib/utils";
import { doc, getDoc } from "firebase/firestore";

// Local fallback ChatViewer component to avoid missing module error during development.
// const ChatViewer = () => {
//   return (
//     <div className="bg-card p-4 rounded">
//       <h3 className="text-lg font-semibold mb-2">Chat</h3>
//       <p className="text-sm text-muted-foreground">Viewer non disponibile; componente fallback</p>
//     </div>
//   );
// };

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [userInfo, setUserInfo] = useState<{ nome: string; cognome: string; email: string } | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserInfo({
            nome: data.nome || "",
            cognome: data.cognome || "",
            email: data.email || user.email || ""
          });
        } else {
          setUserInfo({ nome: "", cognome: "", email: user.email || "" });
        }
      }
    };
    fetchUserInfo();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} userInfo={userInfo} />

      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Benvenuto nel Dashboard</h1>
            <p className="text-muted-foreground">
              Monitora le metriche e le attività del tuo sito di affitti
            </p>
          </div>

          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Utenti Totali"
                  value="1,284"
                  change="+12% dal mese scorso"
                  changeType="positive"
                  icon={Users}
                  gradient="1"
                />
                <MetricCard
                  title="Utenti Attivi Oggi"
                  value="342"
                  change="+5% da ieri"
                  changeType="positive"
                  icon={UserCheck}
                  gradient="2"
                />
                <MetricCard
                  title="Nuove Registrazioni"
                  value="48"
                  change="+18% questa settimana"
                  changeType="positive"
                  icon={UserPlus}
                  gradient="3"
                />
                <MetricCard
                  title="Visualizzazioni Totali"
                  value="15.2K"
                  change="+8% dal mese scorso"
                  changeType="positive"
                  icon={Eye}
                  gradient="4"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ActivityChart />
                <Card className="shadow-card p-6">
                  <h2 className="text-xl font-semibold mb-4">Statistiche Rapide</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-border">
                      <span className="text-muted-foreground">Tasso di Conversione</span>
                      <span className="font-semibold">3.2%</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-border">
                      <span className="text-muted-foreground">Tempo Medio Sessione</span>
                      <span className="font-semibold">4m 32s</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-border">
                      <span className="text-muted-foreground">Annunci Attivi</span>
                      <span className="font-semibold">234</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Rate di Rimbalzo</span>
                      <span className="font-semibold">42%</span>
                    </div>
                  </div>
                </Card>
              </div>

              <UsersTable />
            </>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <UsersTable />
            </div>
          )}

          {activeTab === "verification" && <VerificationRequests />}

          {activeTab === "reports" && <ReportManagement />}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <ActivityChart />
            </div>
          )}

          {activeTab === "settings" && (
            <Card className="shadow-card p-6">
              <h2 className="text-xl font-semibold mb-4">Impostazioni</h2>
              <p className="text-muted-foreground">
                Configurazione del dashboard in arrivo...
              </p>
            </Card>
          )}

          {activeTab === "chat" && (
            <div className="space-y-6">
              <ChatViewer />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
