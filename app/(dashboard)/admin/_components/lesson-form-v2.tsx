"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { Id } from "@/convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Video, CheckCircle2 } from "lucide-react";

interface LessonFormV2Props {
  onSuccess?: () => void;
  editingLesson?: {
    _id: Id<"lessons">;
    moduleId: Id<"modules">;
    title: string;
    slug: string;
    description: string;
    durationSeconds: number;
    order_index: number;
    lessonNumber: number;
    isPublished: boolean;
    tags?: string[];
    videoId?: string;
    thumbnailUrl?: string;
    publicUrl?: string;
    bunnyStoragePath?: string;
  } | null;
  onCancelEdit?: () => void;
}

export function LessonFormV2({ onSuccess, editingLesson, onCancelEdit }: LessonFormV2Props) {
  // Estado do upload de vídeo
  const [file, setFile] = useState<File | null>(null);
  const [videoId, setVideoId] = useState("");
  const [libraryId, setLibraryId] = useState("");
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Estados dos campos do formulário
  const [moduleId, setModuleId] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("");
  const [orderIndex, setOrderIndex] = useState("");
  const [tags, setTags] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  
  // Campos automáticos (vindos do Bunny após upload)
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [bunnyStoragePath, setBunnyStoragePath] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const modules = useQuery(api.modules.list);
  const createLesson = useMutation(api.lessons.create);
  const updateLesson = useMutation(api.lessons.update);
  const updateVideo = useMutation(api.videos.update);
  const { toast } = useToast();

  // Carregar dados se estiver editando
  useEffect(() => {
    if (editingLesson) {
      setModuleId(editingLesson.moduleId);
      setVideoTitle(editingLesson.title);
      setVideoDescription(editingLesson.description);
      setDurationSeconds(editingLesson.durationSeconds.toString());
      setOrderIndex(editingLesson.order_index.toString());
      setTags(editingLesson.tags?.join(", ") || "");
      setIsPublished(editingLesson.isPublished);
      setVideoId(editingLesson.videoId || "");
      setThumbnailUrl(editingLesson.thumbnailUrl || "");
      setPublicUrl(editingLesson.publicUrl || "");
      setBunnyStoragePath(editingLesson.bunnyStoragePath || "");
    }
  }, [editingLesson]);

  // Calcular número da aula automaticamente
  useEffect(() => {
    if (moduleId && !editingLesson) {
      // Buscar quantas aulas já existem neste módulo
      const fetchLessonCount = async () => {
        // Aqui você pode fazer uma query para contar as aulas do módulo
        // Por enquanto, vamos deixar que o usuário defina manualmente
      };
      fetchLessonCount();
    }
  }, [moduleId, editingLesson]);

  // Auto-gerar slug a partir do título do vídeo
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleVideoTitleChange = (value: string) => {
    setVideoTitle(value);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('video/')) {
        toast({
          title: 'Erro',
          description: 'Por favor, selecione um arquivo de vídeo',
          variant: 'destructive',
        });
        return;
      }

      const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
      if (selectedFile.size > maxSize) {
        toast({
          title: 'Erro',
          description: 'O arquivo é muito grande (máximo 5GB)',
          variant: 'destructive',
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleCreateAndUpload = async () => {
    if (!file || !videoTitle.trim()) {
      toast({
        title: 'Erro',
        description: 'Selecione um arquivo e preencha o título',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Passo 1: Criar vídeo no Bunny
      setIsCreatingVideo(true);
      const createResponse = await fetch('/api/bunny/create-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: videoTitle,
          description: videoDescription,
          isPrivate: true,
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || 'Falha ao criar vídeo');
      }

      const createData = await createResponse.json();
      setVideoId(createData.videoId);
      setLibraryId(createData.libraryId);
      setIsCreatingVideo(false);

      toast({
        title: 'Vídeo criado!',
        description: 'Iniciando upload...',
      });

      // Passo 2: Fazer upload do arquivo
      setIsUploading(true);
      setUploadProgress(0);

      const uploadUrl = `/api/bunny/upload?videoId=${encodeURIComponent(createData.videoId)}&libraryId=${encodeURIComponent(createData.libraryId)}`;
      
      const xhr = new XMLHttpRequest();

      return new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            toast({
              title: 'Sucesso',
              description: 'Vídeo enviado! O Bunny está processando.',
            });
            
            setVideoId(createData.videoId);
            setUploadProgress(100);
            setIsUploading(false);
            
            // Buscar informações do vídeo do Bunny (não-bloqueante)
            // Fire-and-forget: não aguardar conclusão para não atrasar o usuário
            fetch(
              `/api/bunny/get-video-info?videoId=${encodeURIComponent(createData.videoId)}&libraryId=${encodeURIComponent(createData.libraryId)}`
            )
              .then(async (infoResponse) => {
                if (infoResponse.ok) {
                  const videoData = await infoResponse.json();
                  
                  console.log('Video info from Bunny:', videoData);
                  
                  // Atualizar estado com informações reais do Bunny
                  if (videoData.urls?.thumbnail) {
                    setThumbnailUrl(videoData.urls.thumbnail);
                  }
                  if (videoData.urls?.hls) {
                    setPublicUrl(videoData.urls.hls);
                  }
                  if (videoData.processed?.durationSeconds) {
                    setDurationSeconds(videoData.processed.durationSeconds.toString());
                  }
                  
                  // ✅ ATUALIZAR TABELA VIDEOS NO CONVEX (não-bloqueante)
                  updateVideo({
                    videoId: createData.videoId,
                    thumbnailUrl: videoData.urls?.thumbnail,
                    hlsUrl: videoData.urls?.hls,
                    status: videoData.processed?.isReady ? 'ready' as const : 'processing' as const,
                  })
                    .then(() => console.log('✅ Tabela videos atualizada no Convex'))
                    .catch((updateError) => console.error('Erro ao atualizar tabela videos:', updateError));
                  
                  // Mostrar informações extras no toast
                  if (videoData.processed?.statusText) {
                    toast({
                      title: 'Informações do vídeo atualizadas',
                      description: `Status: ${videoData.processed.statusText} | Duração: ${videoData.processed.durationSeconds}s`,
                    });
                  }
                }
              })
              .catch((infoError) => {
                console.error('Erro ao buscar info do vídeo:', infoError);
                // Não bloquear o fluxo se falhar
              });
            
            resolve();
          } else {
            const response = JSON.parse(xhr.responseText);
            reject(new Error(response.error || `Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Erro de rede ao fazer upload'));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao fazer upload',
        variant: 'destructive',
      });
      setIsCreatingVideo(false);
      setIsUploading(false);
    }
  };

  const handlePublishLesson = async (publish: boolean) => {
    if (!moduleId || !videoTitle.trim() || !videoDescription.trim() || !orderIndex) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    if (!videoId) {
      toast({
        title: 'Erro',
        description: 'Faça o upload do vídeo primeiro',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const slug = generateSlug(videoTitle);
      const tagsArray = tags.trim() ? tags.split(",").map(tag => tag.trim()) : undefined;
      const duration = durationSeconds ? parseInt(durationSeconds) : 0;
      
      // Calcular lessonNumber automaticamente se não estiver editando
      let lessonNum = editingLesson?.lessonNumber || 1;
      if (!editingLesson && modules) {
        const currentModule = modules.find(m => m._id === moduleId);
        if (currentModule) {
          lessonNum = currentModule.totalLessonVideos + 1;
        }
      }

      if (editingLesson) {
        await updateLesson({
          id: editingLesson._id,
          moduleId: moduleId as any,
          title: videoTitle,
          slug,
          description: videoDescription,
          durationSeconds: duration,
          order_index: parseInt(orderIndex),
          lessonNumber: lessonNum,
          isPublished: publish,
          tags: tagsArray,
          videoId: videoId || undefined,
          bunnyStoragePath: bunnyStoragePath || undefined,
          publicUrl: publicUrl || undefined,
          thumbnailUrl: thumbnailUrl || undefined,
        } as any);

        toast({
          title: 'Sucesso',
          description: publish ? 'Aula publicada com sucesso!' : 'Aula atualizada com sucesso!',
        });
      } else {
        await createLesson({
          moduleId: moduleId as any,
          title: videoTitle,
          slug,
          description: videoDescription,
          durationSeconds: duration,
          order_index: parseInt(orderIndex),
          lessonNumber: lessonNum,
          isPublished: publish,
          tags: tagsArray,
          videoId: videoId || undefined,
          bunnyStoragePath: bunnyStoragePath || undefined,
          publicUrl: publicUrl || undefined,
          thumbnailUrl: thumbnailUrl || undefined,
        } as any);

        toast({
          title: 'Sucesso',
          description: publish ? 'Aula criada e publicada!' : 'Aula criada com sucesso!',
        });
      }

      // Limpar formulário
      if (!editingLesson) {
        setModuleId("");
        setVideoTitle("");
        setVideoDescription("");
        setDurationSeconds("");
        setOrderIndex("");
        setTags("");
        setIsPublished(false);
        setVideoId("");
        setFile(null);
        setUploadProgress(0);
        setThumbnailUrl("");
        setPublicUrl("");
        setBunnyStoragePath("");
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar aula',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasVideo = !!videoId;
  const isProcessing = isCreatingVideo || isUploading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingLesson ? "Editar Aula" : "Nova Aula"}</CardTitle>
        <CardDescription>
          {editingLesson ? "Atualize as informações da aula" : "Faça upload do vídeo e preencha as informações"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SEÇÃO 1: UPLOAD DE VÍDEO */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            <h3 className="font-semibold">1. Upload do Vídeo</h3>
          </div>

          {!hasVideo && !isProcessing && (
            <>
              <div>
                <label className="text-sm font-medium">Selecione o arquivo de vídeo *</label>
                <Input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="mt-1"
                  disabled={isProcessing}
                />
                {file && (
                  <p className="text-xs text-muted-foreground mt-1">
                    📁 {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Título do Vídeo *</label>
                <Input
                  value={videoTitle}
                  onChange={(e) => handleVideoTitleChange(e.target.value)}
                  placeholder="Ex: Aula 01 - Introdução"
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Descrição *</label>
                <Textarea
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Descrição do vídeo"
                  disabled={isProcessing}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleCreateAndUpload} 
                disabled={!file || !videoTitle.trim() || isProcessing}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Criar Vídeo e Fazer Upload
              </Button>
            </>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{isCreatingVideo ? 'Criando vídeo...' : 'Enviando vídeo...'}</span>
                {isUploading && <span>{uploadProgress}%</span>}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: isCreatingVideo ? '50%' : `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Não feche esta página até o upload terminar.
              </p>
            </div>
          )}

          {hasVideo && !isProcessing && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Vídeo vinculado com sucesso!
                </p>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 font-mono">
                ID: {videoId}
              </p>
            </div>
          )}
        </div>

        {/* SEÇÃO 2: INFORMAÇÕES DA AULA */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            <h3 className="font-semibold">2. Informações da Aula</h3>
          </div>

          <div>
            <label className="text-sm font-medium">Módulo *</label>
            <Select value={moduleId} onValueChange={setModuleId} disabled={!hasVideo || isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um módulo" />
              </SelectTrigger>
              <SelectContent>
                {modules?.map((module) => (
                  <SelectItem key={module._id} value={module._id}>
                    {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Duração (segundos)</label>
              <Input
                type="number"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                placeholder="0"
                min="0"
                disabled={!hasVideo || isSubmitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Ordem *</label>
              <Input
                type="number"
                value={orderIndex}
                onChange={(e) => setOrderIndex(e.target.value)}
                placeholder="1"
                min="1"
                disabled={!hasVideo || isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Tags (separadas por vírgula)</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="anatomia, básico, ortopedia"
              disabled={!hasVideo || isSubmitting}
            />
          </div>

          {/* Campos automáticos (apenas exibição) */}
          {(thumbnailUrl || publicUrl || bunnyStoragePath) && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                📋 Informações do Bunny (automático)
              </p>
              {thumbnailUrl && (
                <p className="text-xs text-blue-700 dark:text-blue-300 truncate">
                  🖼️ Thumbnail: {thumbnailUrl}
                </p>
              )}
              {publicUrl && (
                <p className="text-xs text-blue-700 dark:text-blue-300 truncate">
                  🔗 URL: {publicUrl}
                </p>
              )}
              {bunnyStoragePath && (
                <p className="text-xs text-blue-700 dark:text-blue-300 truncate">
                  📁 Storage: {bunnyStoragePath}
                </p>
              )}
            </div>
          )}
        </div>

        {/* SEÇÃO 3: AÇÕES */}
        <div className="flex gap-3 pt-4 border-t">
          {editingLesson && onCancelEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancelEdit}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
          
          <Button
            onClick={() => handlePublishLesson(false)}
            disabled={!hasVideo || isSubmitting}
            variant="outline"
            className="flex-1"
          >
            {isSubmitting ? 'Salvando...' : editingLesson ? 'Atualizar Aula' : 'Salvar como Rascunho'}
          </Button>

          <Button
            onClick={() => handlePublishLesson(true)}
            disabled={!hasVideo || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Publicando...' : editingLesson ? 'Publicar Alterações' : 'Publicar Aula'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

