import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface User {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  lastAccess: string;
  registrationDate: string;
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "Marco Rossi",
    email: "marco.rossi@example.com",
    status: "active",
    lastAccess: "2 ore fa",
    registrationDate: "15/01/2024",
  },
  {
    id: "2",
    name: "Laura Bianchi",
    email: "laura.bianchi@example.com",
    status: "active",
    lastAccess: "5 ore fa",
    registrationDate: "12/01/2024",
  },
  {
    id: "3",
    name: "Giuseppe Verdi",
    email: "giuseppe.verdi@example.com",
    status: "inactive",
    lastAccess: "3 giorni fa",
    registrationDate: "08/01/2024",
  },
  {
    id: "4",
    name: "Anna Ferrari",
    email: "anna.ferrari@example.com",
    status: "active",
    lastAccess: "1 ora fa",
    registrationDate: "20/01/2024",
  },
  {
    id: "5",
    name: "Paolo Esposito",
    email: "paolo.esposito@example.com",
    status: "active",
    lastAccess: "30 minuti fa",
    registrationDate: "18/01/2024",
  },
];

export const UsersTable = () => {
  return (
    <Card className="shadow-card">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Utenti Recenti</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ultimo Accesso</TableHead>
              <TableHead>Registrazione</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={user.status === "active" ? "default" : "secondary"}
                    className={
                      user.status === "active"
                        ? "bg-success text-success-foreground"
                        : ""
                    }
                  >
                    {user.status === "active" ? "Attivo" : "Inattivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.lastAccess}</TableCell>
                <TableCell className="text-muted-foreground">{user.registrationDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
