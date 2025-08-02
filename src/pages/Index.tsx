import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Shield, Zap } from "lucide-react";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              College Chat App
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with your classmates in real-time. Share ideas, collaborate on projects, and stay in touch with your college community.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardHeader className="text-center">
                <MessageSquare className="h-12 w-12 text-primary mx-auto mb-2" />
                <CardTitle>Real-time Messaging</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Chat instantly with classmates in public rooms or private conversations
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-2" />
                <CardTitle>Connect with Peers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Find and connect with students from your college and courses
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-2" />
                <CardTitle>Secure & Private</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Your conversations are protected with enterprise-grade security
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="space-y-4 pt-8">
            <Button size="lg" className="text-lg px-8" asChild>
              <a href="/auth">Get Started</a>
            </Button>
            <p className="text-sm text-muted-foreground">
              Join your college community today
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}