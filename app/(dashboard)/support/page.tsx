import { Instagram, Mail } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-semibold">Suporte</h1>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <div>
              <h2 className="text-lg font-medium">
                Como usar o OrtoClub TEOT da melhor forma
              </h2>
              <p className="text-muted-foreground mt-1">
                Bem-vindo ao OrtoClub TEOT, sua plataforma de aulas em vídeo
                pensada para uma preparação estruturada, contínua e estratégica
                para o TEOT e para a formação em Ortopedia. Para aproveitar ao
                máximo, é importante entender como cada área funciona e como ela
                se integra ao OrtoQBank, potencializando seus resultados.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span>🎯 Meu Perfil</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                A seção Meu Perfil é onde você acompanha sua jornada dentro do
                OrtoClub TEOT. Aqui você pode: Visualizar seu progresso geral
                nas aulas Acompanhar módulos concluídos e pendentes Monitorar
                sua consistência de estudo Essas informações ajudam você a
                manter regularidade e identificar rapidamente onde precisa
                avançar ou reforçar o estudo.
                <br />
                <br />
                <b>➡️ Integração com o OrtoQBank: </b>
                Seu desempenho nas aulas pode ser usado como guia para
                direcionar melhor a resolução de questões no OrtoQBank, focando
                exatamente nos temas que você já estudou — ou que precisa
                revisar.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span>🎥 Aulas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Na seção Aulas, você encontra todo o conteúdo teórico do
                OrtoClub TEOT, organizado de forma lógica e progressiva. Você
                terá acesso a: Aulas divididas por especialidades e temas
                cobrados no TEOT Conteúdo direto ao ponto, com enfoque prático e
                prova-orientado Organização que permite seguir uma trilha
                completa ou estudar temas específicos conforme sua necessidade
                Cada aula foi pensada para entregar o fundamento teórico
                essencial, servindo como base para a resolução de questões e
                para a consolidação do conhecimento. O único do mercado com
                todos os professores especialistas pela Universidade de São
                Paulo (USP)
                <br />
                <br />
                <b>➡️ Integração com o OrtoQBank:</b>
                Após assistir às aulas, você pode reforçar o aprendizado
                resolvendo questões correspondentes no OrtoQBank, garantindo
                fixação ativa do conteúdo e contato com o estilo real da prova.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span>⭐ Meus Favoritos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                A área Meus Favoritos funciona como seu espaço pessoal de
                organização. Aqui você pode: Salvar aulas mais importantes
                Marcar conteúdos que deseja rever antes da prova Criar uma lista
                rápida para revisões estratégicas Organizar o estudo de acordo
                com seu momento (R1, R2, R3 ou reta final) Essa funcionalidade
                facilita revisões rápidas e estudos direcionados, especialmente
                em fases mais avançadas da preparação.
                <br />
                <br />
                <b>➡️ Integração com o OrtoQBank:</b>
                Os temas favoritos podem ser usados como base para criar testes
                personalizados no OrtoQBank, permitindo revisar teoria e prática
                de forma totalmente alinhada.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span>🔗 Estudo Integrado: OrtoClub TEOT + OrtoQBank</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                A grande força da sua preparação está na integração entre aulas
                e questões:
                <br />
                OrtoClub TEOT → fornece o embasamento teórico estruturado
                <br />
                OrtoQBank → transforma esse conhecimento em treino ativo e
                prova-orientado
                <br />
                Usando as duas plataformas em conjunto, você estuda:
                <br />
                <br />
                <b>* A teoria certa</b>
                <br />
                <b>* No momento certo</b>
                <br />
                <b>* Com treino direcionado</b>
                <br />
                <b>* E análise real de desempenho</b>
                <br />
                <br />
                Tudo isso para uma preparação mais eficiente, inteligente e com
                foco em aprovação.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contato</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              Caso tenha alguma dúvida ou sugestão, ficamos à disposição nos
              contatos:
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:Ortoclub@gmail.com"
                className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm transition-colors hover:bg-slate-200"
              >
                <Mail className="h-4 w-4" />
                <span>Ortoclub@gmail.com</span>
              </a>
              <a
                href="https://instagram.com/orto.club"
                className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm transition-colors hover:bg-slate-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="h-4 w-4" />
                <span>@orto.club</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
