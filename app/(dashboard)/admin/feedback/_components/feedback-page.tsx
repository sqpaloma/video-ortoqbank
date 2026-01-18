"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MessageSquare, Star } from "lucide-react";
import { FeedbackList } from "./feedback-list";
import { RatingsList } from "./ratings-list";

export function FeedbackPage() {
  const { state } = useSidebar();
  const feedbacks = useQuery(api.feedback.getAllFeedbackWithDetails);
  const ratings = useQuery(api.ratings.getAllRatingsWithDetails);

  return (
    <div className="min-h-screen relative">
      {/* Sidebar trigger - follows sidebar position */}
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-brand-blue hover:text-brand-blue hover:bg-brand-blue transition-[left] duration-200 ease-linear z-10 ${
          state === "collapsed"
            ? "left-[calc(var(--sidebar-width-icon)+0.25rem)]"
            : "left-[calc(var(--sidebar-width)+0.25rem)]"
        }`}
      />

      {/* Header */}
      <div className="border-b">
        <div className="p-4 pt-12 flex items-center pl-14 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Feedbacks e Avaliações
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="feedback" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="feedback" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Feedbacks ({feedbacks?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="ratings" className="gap-2">
                <Star className="h-4 w-4" />
                Avaliações ({ratings?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feedback" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Todos os Feedbacks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!feedbacks ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Carregando feedbacks...
                    </div>
                  ) : feedbacks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum feedback encontrado
                    </div>
                  ) : (
                    <FeedbackList feedbacks={feedbacks} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ratings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Todas as Avaliações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!ratings ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Carregando avaliações...
                    </div>
                  ) : ratings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma avaliação encontrada
                    </div>
                  ) : (
                    <RatingsList ratings={ratings} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
