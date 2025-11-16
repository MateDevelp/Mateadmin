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
import { FileText, CheckCircle, XCircle, Eye } from "lucide-react";
import { useState } from "react";

interface VerificationRequest {
  id: string;
  userName: string;
  email: string;
  documentType: string;
  submittedDate: string;
  status: "pending" | "approved" | "rejected";
}

const mockRequests: VerificationRequest[] = [
  {
    id: "1",
    userName: "Marco Rossi",
    email: "marco.rossi@example.com",
    documentType: "Carta d'Identità",
    submittedDate: "22/01/2024",
    status: "pending",
  },
  {
    id: "2",
    userName: "Laura Bianchi",
    email: "laura.bianchi@example.com",
    documentType: "Passaporto",
    submittedDate: "21/01/2024",
    status: "pending",
  },
  {
    id: "3",
    userName: "Giuseppe Verdi",
    email: "giuseppe.verdi@example.com",
    documentType: "Carta d'Identità",
    submittedDate: "20/01/2024",
    status: "approved",
  },
  {
    id: "4",
    userName: "Anna Ferrari",
    email: "anna.ferrari@example.com",
    documentType: "Patente",
    submittedDate: "19/01/2024",
    status: "rejected",
  },
];

export const VerificationRequests = () => {
  const [requests, setRequests] = useState(mockRequests);

  const handleApprove = (id: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "approved" as const } : req))
    );
  };

  const handleReject = (id: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "rejected" as const } : req))
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
            In Attesa
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
            Approvato
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
            Rifiutato
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
          <h1 className="text-3xl font-bold mb-2">Verifiche Account</h1>
          <p className="text-muted-foreground">
            Gestisci le richieste di verifica documenti degli utenti
          </p>
        </div>
        <Badge className="bg-metric-gradient-2 text-white border-0 px-4 py-2">
          {requests.filter((r) => r.status === "pending").length} In Attesa
        </Badge>
      </div>

      <Card className="shadow-card">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Richieste di Verifica</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tipo Documento</TableHead>
                <TableHead>Data Invio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.userName}</TableCell>
                  <TableCell className="text-muted-foreground">{request.email}</TableCell>
                  <TableCell>{request.documentType}</TableCell>
                  <TableCell className="text-muted-foreground">{request.submittedDate}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-primary/20 hover:bg-primary/5"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizza
                      </Button>
                      {request.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-success/20 hover:bg-success/5 text-success"
                            onClick={() => handleApprove(request.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approva
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive/20 hover:bg-destructive/5 text-destructive"
                            onClick={() => handleReject(request.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rifiuta
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
