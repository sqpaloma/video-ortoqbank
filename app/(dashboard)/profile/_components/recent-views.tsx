import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, PlayCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { formatDuration, formatTimeAgo } from "./profile-inner";
import { useRouter } from "next/navigation";


export function RecentViews() {

 /*    const { userId } = useAuth();
    const recentViews = useQuery(api.recentViews.getRecentViewsWithDetails, {
        userId: userId || "",
        limit: 3,
    }); */

    const router = useRouter();

    const recentViews = [
        {
            _id: "1",
            title: "Aula 1",
            description: "Descrição da aula 1",
            thumbnailUrl: "https://via.placeholder.com/150",
            durationSeconds: 100,
            isCompleted: false,
            category: {
                _id: "1",
                title: "Categoria 1",
            },
            lesson: {
                _id: "1",
                title: "Aula 1",
                thumbnailUrl: "https://via.placeholder.com/150",
                durationSeconds: 100,
            },
            viewedAt: 1717564800,
        },
        {
            _id: "2",
            title: "Aula 2",
            description: "Descrição da aula 2",
            thumbnailUrl: "https://via.placeholder.com/150",
            durationSeconds: 200,
            isCompleted: true,
            category: {
                _id: "1",
                title: "Categoria 1",
            },
            lesson: {
                _id: "1",
                title: "Aula 1",
                thumbnailUrl: "https://via.placeholder.com/150",
                durationSeconds: 200,
            },
            viewedAt: 1717564800,
        },
        {
            _id: "3",
            title: "Aula 3",
            description: "Descrição da aula 3",
            thumbnailUrl: "https://via.placeholder.com/150",
            durationSeconds: 300,
            isCompleted: false,
            category: {
                _id: "1",
                title: "Categoria 1",
            },
            lesson: {
                _id: "1",
                title: "Aula 1",
                thumbnailUrl: "https://via.placeholder.com/150",
                durationSeconds: 300,
            },
            viewedAt: 1717564800,
        },
    ];

    return (
        <>

            {recentViews && recentViews.length === 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Aulas Recentes</CardTitle>
                        <CardDescription>Suas aulas visualizadas recentemente</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <PlayCircle size={48} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">
                                Você ainda não assistiu nenhuma aula.
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                                Comece a explorar as categorias e módulos disponíveis!
                            </p>
                            <Button
                                variant="default"
                                className="mt-4"
                                onClick={() => router.push("/categories")}
                            >
                                Explorar Aulas
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}


            <Card>
                <CardHeader>
                    <CardTitle>Aulas Recentes</CardTitle>
                    <CardDescription>Suas aulas visualizadas recentemente</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentViews && recentViews.map((view) => {
                            const isCompleted = view.isCompleted;
                            const borderColor = isCompleted ? "border-green-500" : "border-blue-500";
                            const textColor = isCompleted ? "text-green-600" : "text-blue-600";
                            const iconColor = isCompleted ? "text-green-500" : "text-blue-500";

                            return (

                                <div
                                    key={view._id}
                                    onClick={() => router.push(`/modules/${view.category._id}`)}
                                    className={`flex items-center gap-4 p-3 rounded-lg border-2 ${borderColor} hover:bg-accent transition-colors cursor-pointer`}
                                >
                                    {view.lesson.thumbnailUrl ? (
                                        <Image
                                            src={view.lesson.thumbnailUrl}
                                            alt={view.lesson.title}
                                            width={96}
                                            height={64}
                                            className="rounded object-cover"
                                        />
                                    ) : (
                                        <div className="w-24 h-16 rounded bg-muted flex items-center justify-center">
                                            <PlayCircle className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`font-medium truncate ${textColor}`}>{view.lesson.title}</h4>
                                        <p className="text-sm text-muted-foreground">{view.category.title}</p>
                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDuration(view.lesson.durationSeconds)}
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {formatTimeAgo(view.viewedAt)}
                                            </span>
                                            {isCompleted ? (
                                                <Badge variant="secondary" className={`text-xs border-green-500 bg-green-50 ${textColor}`}>
                                                    <CheckCircle2 className={`h-3 w-3 mr-1 ${iconColor}`} />
                                                    Concluída
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className={`text-xs border-blue-500 bg-blue-50 ${textColor}`}>
                                                    <PlayCircle className={`h-3 w-3 mr-1 ${iconColor}`} />
                                                    Iniciada
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </>
    )
} 
