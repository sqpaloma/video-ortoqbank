"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTenantPaginatedQuery } from "@/hooks/use-tenant-convex";
import { api } from "@/convex/_generated/api";
import { MessageSquare, Star } from "lucide-react";
import { FeedbackList } from "./feedback-list";
import { RatingsList } from "./ratings-list";

export function FeedbackPage() {
  const { state } = useSidebar();
  const {
    results: feedbacks,
    status: feedbackStatus,
    loadMore: loadMoreFeedbacks,
  } = useTenantPaginatedQuery(
    api.feedback.getAllFeedbackWithDetails,
    {},
    { initialNumItems: 10 },
  );

  const {
    results: ratings,
    status: ratingsStatus,
    loadMore: loadMoreRatings,
  } = useTenantPaginatedQuery(
    api.ratings.getAllRatingsWithDetails,
    {},
    { initialNumItems: 10 },
  );

  return (
    <div className="min-h-screen relative">
      {/* Sidebar trigger - follows sidebar position */}
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-black hover:text-black hover:bg-gray-100 transition-[left] duration-200 ease-linear z-10 ${state === "collapsed"
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

      {/* Content with standardized padding */}
      <div className="p-6 pb-24 md:p-12">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="feedback" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="feedback" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Feedbacks
              </TabsTrigger>
              <TabsTrigger value="ratings" className="gap-2">
                <Star className="h-4 w-4" />
                Avaliações
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
                  {feedbackStatus === "LoadingFirstPage" ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Carregando feedbacks...
                    </div>
                  ) : !feedbacks || feedbacks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum feedback encontrado
                    </div>
                  ) : (
                    <>
                      <FeedbackList feedbacks={feedbacks} />
                      {feedbackStatus === "CanLoadMore" && (
                        <div className="flex justify-center mt-6">
                          <Button
                            onClick={() => loadMoreFeedbacks(10)}
                            variant="outline"
                          >
                            Ver mais
                          </Button>
                        </div>
                      )}
                      {feedbackStatus === "LoadingMore" && (
                        <div className="text-center py-4 text-muted-foreground">
                          Carregando mais...
                        </div>
                      )}
                    </>
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
                  {ratingsStatus === "LoadingFirstPage" ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Carregando avaliações...
                    </div>
                  ) : !ratings || ratings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma avaliação encontrada
                    </div>
                  ) : (
                    <>
                      <RatingsList ratings={ratings} />
                      {ratingsStatus === "CanLoadMore" && (
                        <div className="flex justify-center mt-6">
                          <Button
                            onClick={() => loadMoreRatings(10)}
                            variant="outline"
                          >
                            Ver mais
                          </Button>
                        </div>
                      )}
                      {ratingsStatus === "LoadingMore" && (
                        <div className="text-center py-4 text-muted-foreground">
                          Carregando mais...
                        </div>
                      )}
                    </>
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
