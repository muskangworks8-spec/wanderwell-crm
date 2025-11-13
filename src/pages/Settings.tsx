import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Settings as SettingsIcon, Facebook, Chrome } from "lucide-react";

export default function Settings() {
  const [fbCredentials, setFbCredentials] = useState({
    appId: "",
    appSecret: "",
    accessToken: "",
  });

  const [googleCredentials, setGoogleCredentials] = useState({
    clientId: "",
    clientSecret: "",
    developerToken: "",
    refreshToken: "",
  });

  const saveFacebookCredentials = () => {
    // In a real implementation, these would be saved to secure backend storage
    toast.success("Facebook Ads credentials saved (mock)");
  };

  const saveGoogleCredentials = () => {
    // In a real implementation, these would be saved to secure backend storage
    toast.success("Google Ads credentials saved (mock)");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Configure integrations and API credentials</p>
          </div>
        </div>

        <Tabs defaultValue="facebook" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="facebook">Facebook Ads</TabsTrigger>
            <TabsTrigger value="google">Google Ads</TabsTrigger>
          </TabsList>

          <TabsContent value="facebook">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Facebook className="h-5 w-5" />
                  <CardTitle>Facebook Ads Integration</CardTitle>
                </div>
                <CardDescription>
                  Connect your Facebook Ads account to automatically capture leads
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fb-app-id">App ID</Label>
                  <Input
                    id="fb-app-id"
                    placeholder="Enter Facebook App ID"
                    value={fbCredentials.appId}
                    onChange={(e) => setFbCredentials({ ...fbCredentials, appId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb-app-secret">App Secret</Label>
                  <Input
                    id="fb-app-secret"
                    type="password"
                    placeholder="Enter Facebook App Secret"
                    value={fbCredentials.appSecret}
                    onChange={(e) => setFbCredentials({ ...fbCredentials, appSecret: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb-access-token">Access Token</Label>
                  <Input
                    id="fb-access-token"
                    type="password"
                    placeholder="Enter Facebook Access Token"
                    value={fbCredentials.accessToken}
                    onChange={(e) => setFbCredentials({ ...fbCredentials, accessToken: e.target.value })}
                  />
                </div>
                <Button onClick={saveFacebookCredentials} className="w-full">
                  Save Facebook Credentials
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="google">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Chrome className="h-5 w-5" />
                  <CardTitle>Google Ads Integration</CardTitle>
                </div>
                <CardDescription>
                  Connect your Google Ads account to automatically capture leads
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="google-client-id">Client ID</Label>
                  <Input
                    id="google-client-id"
                    placeholder="Enter Google Ads Client ID"
                    value={googleCredentials.clientId}
                    onChange={(e) => setGoogleCredentials({ ...googleCredentials, clientId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="google-client-secret">Client Secret</Label>
                  <Input
                    id="google-client-secret"
                    type="password"
                    placeholder="Enter Google Ads Client Secret"
                    value={googleCredentials.clientSecret}
                    onChange={(e) => setGoogleCredentials({ ...googleCredentials, clientSecret: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="google-developer-token">Developer Token</Label>
                  <Input
                    id="google-developer-token"
                    type="password"
                    placeholder="Enter Developer Token"
                    value={googleCredentials.developerToken}
                    onChange={(e) => setGoogleCredentials({ ...googleCredentials, developerToken: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="google-refresh-token">Refresh Token</Label>
                  <Input
                    id="google-refresh-token"
                    type="password"
                    placeholder="Enter Refresh Token"
                    value={googleCredentials.refreshToken}
                    onChange={(e) => setGoogleCredentials({ ...googleCredentials, refreshToken: e.target.value })}
                  />
                </div>
                <Button onClick={saveGoogleCredentials} className="w-full">
                  Save Google Credentials
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
