import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Alert, AlertDescription } from './components/ui/alert';
import { useAdmin } from './AdminContext';

export default function AdminVerification() {
  const navigate = useNavigate();
  const { user, logout } = useAdmin();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="text-4xl">🚫</div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Accesso Negato
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Non hai i permessi per accedere al pannello admin
          </p>
        </CardHeader>
        <CardContent>
          <Alert className="border-orange-200 bg-orange-50">
            <AlertDescription className="text-orange-700">
              {user
                ? "Il tuo account non ha i privilegi di amministratore necessari per accedere a questo pannello."
                : "Devi effettuare l'accesso con un account amministratore."
              }
            </AlertDescription>
          </Alert>

          <div className="mt-6 space-y-4">
            <div className="text-sm text-gray-600">
              <p><strong>Se sei un amministratore:</strong></p>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Verifica di aver effettuato l'accesso con l'account corretto</li>
                <li>Contatta il team tecnico per verificare i tuoi permessi</li>
                <li>Assicurati che il tuo account abbia il ruolo admin</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="flex-1"
              >
                Accedi
              </Button>
              {user && (
                <Button
                  variant="outline"
                  onClick={logout}
                  className="flex-1"
                >
                  Logout
                </Button>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Per assistenza contatta: <br />
                <span className="font-medium text-blue-600">tech@mateapp.it</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
