import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";
import { useState } from "react";

interface Report {
  id: string;
  reporterName: string;
  reportedUser: string;
  reason: string;
  description: string;
  reportDate: string;
  status: "pending" | "reviewed" | "dismissed";
  severity: "low" | "medium" | "high";
}

const mockReports: Report[] = [
  {
    id: "1",
    reporterName: "Laura Bianchi",
    reportedUser: "Mario Neri",
    reason: "Comportamento inappropriato",
    description: "L'utente ha utilizzato linguaggio offensivo nei messaggi",
    reportDate: "23/01/2024",
    status: "pending",
    severity: "high",
  },
  {
    id: "2",
    reporterName: "Giuseppe Verdi",
    reportedUser: "Francesca Gialli",
    reason: "Annuncio fraudolento",
    description: "Sospetto annuncio falso con foto non corrispondenti",
    reportDate: "22/01/2024",
    status: "pending",
    severity: "high",
  },
  {
    id: "3",
    reporterName: "Anna Ferrari",
    reportedUser: "Carlo Blu",
    reason: "Spam",
    description: "Invio ripetuto di messaggi non richiesti",
    reportDate: "21/01/2024",
    status: "reviewed",
    severity: "medium",
  },
  {
    id: "4",
    reporterName: "Paolo Esposito",
    reportedUser: "Maria Viola",
    reason: "Informazioni false",
    description: "Dichiarazioni non veritiere nel profilo",
    reportDate: "20/01/2024",
    status: "dismissed",
    severity: "low",
  },
];

export const ReportManagement = () => {
  const [reports, setReports] = useState(mockReports);

  const handleReview = (id: string) => {
    setReports((prev) =>
      prev.map((report) => (report.id === id ? { ...report, status: "reviewed" as const } : report))
    );
  };

  const handleDismiss = (id: string) => {
    setReports((prev) =>
      prev.map((report) => (report.id === id ? { ...report, status: "dismissed" as const } : report))
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
            Da Verificare
          </Badge>
        );
      case "reviewed":
        return (
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
            Verificato
          </Badge>
        );
      case "dismissed":
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground border-border">
            Archiviato
          </Badge>
        );
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return (
          <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
            Alta
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
            Media
          </Badge>
        );
      case "low":
        return (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            Bassa
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestione Segnalazioni</h1>
          <p className="text-muted-foreground">
            Verifica e gestisci le segnalazioni inviate dagli utenti
          </p>
        </div>
        <Badge className="bg-metric-gradient-1 text-white border-0 px-4 py-2">
          {reports.filter((r) => r.status === "pending").length} Da Verificare
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priorità Alta</p>
              <p className="text-2xl font-bold">
                {reports.filter((r) => r.severity === "high" && r.status === "pending").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="shadow-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-warning/10">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priorità Media</p>
              <p className="text-2xl font-bold">
                {reports.filter((r) => r.severity === "medium" && r.status === "pending").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="shadow-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/10">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Verificate</p>
              <p className="text-2xl font-bold">
                {reports.filter((r) => r.status === "reviewed").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="shadow-card">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Segnalazioni Utenti</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utente Segnalato</TableHead>
                <TableHead>Segnalato da</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Gravità</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.reportedUser}</TableCell>
                  <TableCell className="text-muted-foreground">{report.reporterName}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{report.reason}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {report.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getSeverityBadge(report.severity)}</TableCell>
                  <TableCell className="text-muted-foreground">{report.reportDate}</TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-primary/20 hover:bg-primary/5"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Dettagli
                      </Button>
                      {report.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-success/20 hover:bg-success/5 text-success"
                            onClick={() => handleReview(report.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verifica
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-muted hover:bg-muted/5 text-muted-foreground"
                            onClick={() => handleDismiss(report.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Archivia
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
