import { useState, useEffect, useRef } from "react";
import { QrCode, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { evolutionApi } from "../lib/evolutionApi";
import { configManager } from "../lib/config";
import { toast } from "sonner";

export const QRCodeDisplay = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [instanceName, setInstanceName] = useState<string>("");
  const qrTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearQrRequestTimer = () => {
    if (qrTimerRef.current) {
      clearTimeout(qrTimerRef.current);
      qrTimerRef.current = null;
    }
  };

  const scheduleQrRequestTimer = () => {
    clearQrRequestTimer();
    qrTimerRef.current = setTimeout(() => {
      console.warn('⚠️ Timeout forçando fim do loading do QR Code (QRCodeDisplay)');
      setIsLoading(false);
    }, 6000);
  };

  useEffect(() => {
    const config = configManager.getConfig();
    if (config?.instance) {
      setInstanceName(config.instance);
    }
  }, []);

  useEffect(() => {
    return () => {
      clearQrRequestTimer();
    };
  }, []);

  const fetchQRCode = async () => {
    setIsLoading(true);
    scheduleQrRequestTimer();
    try {
      const normalizedInstance = instanceName?.trim().toLowerCase() || 'nexus-whatsapp';
      const result = await evolutionApi.fetchQRCode(normalizedInstance);
      
      if (result.connected) {
        clearQrRequestTimer();
        setIsConnected(true);
        setQrCode(null);
        setPairingCode(null);
        toast.success("WhatsApp conectado!", {
          description: "Sua instância está pronta",
        });
        return;
      }

      setIsConnected(false);
      const rawQr =
        result.qrCode?.base64 ||
        (typeof result.qrCode === 'string' ? result.qrCode : undefined) ||
        result.qrcode?.base64 ||
        (typeof result.qrcode === 'string' ? result.qrcode : undefined) ||
        result.base64 ||
        result.code ||
        result.validBase64;

      if (rawQr) {
        const normalized = rawQr.startsWith('data:')
          ? rawQr
          : `data:image/png;base64,${rawQr}`;
        setQrCode(normalized);
      } else {
        toast.info("Gerando QR Code...", {
          description: "Aguarde alguns instantes e tente novamente",
        });
      }

      setPairingCode(result.pairingCode || result.code || null);
    } catch (error) {
      console.error('Error fetching QR code:', error);
      toast.error("Erro ao buscar QR Code", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      clearQrRequestTimer();
      setIsLoading(false);
    }
  };

  if (!configManager.isConfigured()) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Conectar WhatsApp
          </CardTitle>
          <CardDescription>
            Aguardando configuração do administrador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              O administrador precisa configurar as credenciais da Evolution API nas Configurações do sistema antes de conectar o WhatsApp.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Conectar WhatsApp
        </CardTitle>
        <CardDescription>
          Instância: <strong>{instanceName}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status de Conexão */}
        {isConnected && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-600">
              <strong>WhatsApp conectado! ✅</strong>
              <p className="text-sm mt-1">Sua instância está ativa e funcionando.</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Botão para buscar QR Code - sempre visível */}
        {!qrCode && !pairingCode && (
          <Button
            onClick={fetchQRCode}
            disabled={isLoading}
            className="w-full gap-2"
            size="lg"
            variant={isConnected ? "outline" : "default"}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Buscando QR Code...
              </>
            ) : (
              <>
                <QrCode className="h-5 w-5" />
                {isConnected ? "Gerar Novo QR Code" : "Gerar QR Code"}
              </>
            )}
          </Button>
        )}

        {/* Exibição do QR Code */}
        {qrCode && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border-2 border-border">
                  <img
                    src={`data:image/png;base64,${qrCode}`}
                    alt="QR Code WhatsApp"
                    className="w-full h-auto"
                  />
                </div>
                <Alert>
                  <AlertDescription className="text-sm">
                    <p className="font-semibold mb-2">📱 Como conectar:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Abra o WhatsApp no seu celular</li>
                      <li>Toque em Configurações → Aparelhos conectados</li>
                      <li>Toque em "Conectar um aparelho"</li>
                      <li>Escaneie este QR Code</li>
                    </ol>
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={fetchQRCode}
                  variant="outline"
                  className="w-full gap-2"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar QR Code
                </Button>
          </div>
        )}

        {/* Código de Pareamento */}
        {pairingCode && !qrCode && (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <p className="font-semibold mb-2">🔑 Código de Pareamento:</p>
                    <p className="text-2xl font-mono font-bold text-center py-4 bg-muted rounded-lg">
                      {pairingCode}
                    </p>
                    <p className="text-sm mt-2">
                      Use este código para conectar seu WhatsApp
                    </p>
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={fetchQRCode}
                  variant="outline"
                  className="w-full gap-2"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  Gerar Novo Código
                </Button>
          </div>
        )}

        {/* Botão para verificar conexão - aparece quando há QR Code ou pairing code */}
        {(qrCode || pairingCode) && (
          <Button
            onClick={fetchQRCode}
            variant="secondary"
            className="w-full gap-2"
            size="sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            Verificar Conexão
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
