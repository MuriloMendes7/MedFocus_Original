import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  Moon,
  RotateCw,
  Sparkles,
  Sun,
  ArrowRight,
  Layers,
  Instagram,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import MedFocusLogo from '../components/MedFocusLogo';
import useScrollReveal from '../hooks/useScrollReveal';

// Exemplo clínico realista e palpável (estilo ficha médica / flashcard)
const CLINICAL_CASE_CARD = {
  theme: 'Cardiologia & Terapia Intensiva',
  banca: 'Referência • SBC 2024 / Enare',
  question:
    'Homem de 64 anos, diabético, dá entrada com dor retroesternal em aperto há 45 min. O ECG revela supradesnivelamento de ST de 2,5 mm em D2, D3 e aVF. A pressão arterial é 86x50 mmHg e os pulmões estão limpos. Qual a contraindicação medicamentosa imediata e a conduta prioritária?',
  answer:
    'Contraindicação estrita a nitratos e morfina (risco de choque cardiogênico irreversível por dependência de pré-carga no infarto de ventrículo direito). Conduta: expansão volêmica com cristaloides e derivações direitas (V3R e V4R).',
  clinicalNote:
    'No infarto inferior com hipotensão e campos pulmonares limpos, pense sempre em acometimento de VD antes de prescrever vasodilatadores.',
};

const Home = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  // Scroll animations
  useScrollReveal();

  const [cardFlipped, setCardFlipped] = useState(false);
  const [ratedSample, setRatedSample] = useState(null);

  const handleQuickDemo = async (role = 'student') => {
    await loginAsDemo(role);
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F5] dark:bg-[#121615] text-[#1C2321] dark:text-[#F1F4F2] transition-colors duration-200">
      {/* Barra de Navegação Sóbria */}
      <header className="border-b border-[#E5E0D8] dark:border-[#222B27] bg-[#FAF8F5]/90 dark:bg-[#121615]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center">
              <MedFocusLogo size="md" showBadge={false} />
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4D5A55] dark:text-[#A1B0AA]">
              <a href="#como-funciona" className="hover:text-[#1A3835] dark:hover:text-[#FAF8F5] transition">
                O Método
              </a>
              <a href="#conteudo" className="hover:text-[#1A3835] dark:hover:text-[#FAF8F5] transition">
                Baralhos Clínicos
              </a>
              <a href="#rotina" className="hover:text-[#1A3835] dark:hover:text-[#FAF8F5] transition">
                Rotina de Revisão
              </a>
              <a href="#planos" className="hover:text-[#1A3835] dark:hover:text-[#FAF8F5] transition">
                Planos
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                aria-label="Alternar tema"
                className="p-2 rounded-lg text-[#55635E] dark:text-[#9DAEA8] hover:bg-[#EFECE5] dark:hover:bg-[#1C2421] transition"
                title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-[#D8B168]" />}
              </button>

              {user ? (
                <Link
                  to="/dashboard"
                  className="bg-[#1A3835] hover:bg-[#254F4B] text-[#FAF8F5] dark:bg-[#2A4E49] dark:hover:bg-[#34625C] px-5 py-2.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5"
                >
                  <span>Meu Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuickDemo('student')}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-[#1A3835] dark:text-[#D1E0D9] bg-[#EAE6DD] dark:bg-[#1E2824] hover:bg-[#DFD9CD] transition border border-[#D5CEC0] dark:border-[#2F3E38]"
                  >
                    <span>Experimentar sem cadastro</span>
                  </button>
                  <Link
                    to="/login"
                    className="bg-[#1A3835] hover:bg-[#234A46] text-[#FAF8F5] dark:bg-[#2A4E49] dark:hover:bg-[#34625C] px-4 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    Entrar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section Editorial e Assimétrica */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-28 border-b border-[#E8E3DB] dark:border-[#222B27]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Coluna Esquerda: Texto Humanizado e Empático */}
            <div className="lg:col-span-7 space-y-6 reveal">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE6DD] dark:bg-[#1C2622] text-[#244B45] dark:text-[#A8BFB6] text-xs font-medium border border-[#DDD6C8] dark:border-[#2A3B34]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#527063]" />
                <span>Estudo médico com repetição espaçada</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-serif font-normal leading-[1.18] tracking-tight text-[#16211E] dark:text-[#F3F6F4]">
                Você não precisa memorizar a medicina inteira hoje.{' '}
                <span className="italic text-[#375249] dark:text-[#A1B8AE] font-normal">
                  Apenas revisar o conceito certo, no dia certo.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#55635E] dark:text-[#9DAEA8] leading-relaxed max-w-xl">
                A rotina de plantões e internato sobrecarrega qualquer estudante. O MedFocus organiza
                o espaçamento matemático das suas revisões para que 25 minutos diários sustentem meses de aprendizado
                sem que você esqueça na hora da prova.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleQuickDemo('student')}
                  className="inline-flex items-center justify-center gap-2 bg-[#1A3835] hover:bg-[#254F4A] text-[#FAF8F5] dark:bg-[#274B46] dark:hover:bg-[#315D57] px-6 py-3.5 rounded-xl font-medium text-sm transition shadow-sm"
                >
                  <span>Abrir demonstração clínica</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-1.5 bg-transparent hover:bg-[#EAE5DB] dark:hover:bg-[#1B2421] text-[#1A3835] dark:text-[#D7E3DD] border border-[#CFC7B8] dark:border-[#32433D] px-5 py-3.5 rounded-xl font-medium text-sm transition"
                >
                  Criar minha conta gratuita
                </Link>
              </div>

              {/* Rodapé da Hero: Nota de credibilidade sóbria */}
              <div className="pt-4 flex items-center gap-6 text-xs text-[#707F79] dark:text-[#7F918B] border-t border-[#E8E3DB] dark:border-[#222B27]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#527063]" />
                  <span>Algoritmo SM-2 adaptado</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#527063]" />
                  <span>Casos e bancas de Residência</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#527063]" />
                  <span>Sincronizado na nuvem</span>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Ficha de Caso Clínico Tátil e Real */}
            <div className="lg:col-span-5 reveal delay-150">
              <div className="relative">
                {/* Etiqueta superior estilo arquivo físico */}
                <div className="flex items-center justify-between pb-2 px-1 text-[11px] font-mono text-[#788882] dark:text-[#889C94] uppercase tracking-wider">
                  <span>CASO_CLINICO_#084</span>
                  <span>{CLINICAL_CASE_CARD.banca}</span>
                </div>

                {/* Card Físico Estruturado */}
                <div
                  onClick={() => setCardFlipped(!cardFlipped)}
                  className="bg-[#FFFFFF] dark:bg-[#18201D] border border-[#DDD6C8] dark:border-[#2E3C36] rounded-2xl p-6 sm:p-7 shadow-sm transition hover:shadow-md cursor-pointer select-none min-h-[380px] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#EFEBE3] dark:border-[#24312B] text-xs">
                      <span className="font-semibold text-[#527063] dark:text-[#9FB7AD] tracking-wide">
                        {CLINICAL_CASE_CARD.theme}
                      </span>
                      <span className="text-[#8A9A93] text-[11px] flex items-center gap-1">
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Clique para {cardFlipped ? 'ver caso' : 'ver conduta'}</span>
                      </span>
                    </div>

                    <div className="py-5">
                      {!cardFlipped ? (
                        <div className="space-y-4">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#F4F1E9] dark:bg-[#202C27] text-[#6E7E77] dark:text-[#97ABA2] border border-[#E5E0D5] dark:border-[#2B3B34]">
                            Enunciado Clínico
                          </span>
                          <p className="text-base sm:text-[17px] text-[#222E2A] dark:text-[#E8EFEA] leading-relaxed">
                            {CLINICAL_CASE_CARD.question}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#EAF2ED] dark:bg-[#1E2E27] text-[#2D5A46] dark:text-[#99C7B2] border border-[#CFDFD5] dark:border-[#2D453A]">
                            Conduta & Raciocínio
                          </span>
                          <p className="text-base sm:text-[17px] font-semibold text-[#1F3D33] dark:text-[#B6D6C7] leading-relaxed">
                            {CLINICAL_CASE_CARD.answer}
                          </p>
                          <div className="p-3.5 rounded-xl bg-[#F6F4ED] dark:bg-[#1E2824] border border-[#E4DDD0] dark:border-[#2A3832] text-xs text-[#52625C] dark:text-[#9FB1A9] leading-relaxed">
                            <strong>Ponto de fixação:</strong> {CLINICAL_CASE_CARD.clinicalNote}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Feedback SM-2 Sóbrio */}
                  <div className="pt-4 border-t border-[#EFEBE3] dark:border-[#24312B]">
                    <div className="flex items-center justify-between text-[11px] text-[#7A8A84] dark:text-[#889B93] mb-2 font-medium">
                      <span>Como foi sua lembrança?</span>
                      <span>Intervalo calculado</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Esqueci', sub: '10 min', color: 'hover:bg-[#FBECE8] text-[#8F4332]' },
                        { label: 'Difícil', sub: '1 dia', color: 'hover:bg-[#FEF5E7] text-[#916B27]' },
                        { label: 'Bom', sub: '4 dias', color: 'hover:bg-[#EDF5F1] text-[#2F614C]' },
                        { label: 'Fácil', sub: '12 dias', color: 'hover:bg-[#EDF5F1] text-[#205441]' },
                      ].map((b) => (
                        <button
                          key={b.label}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRatedSample(b.label);
                          }}
                          className={`py-2 px-1 text-center rounded-lg border border-[#DCD5C7] dark:border-[#303F39] text-xs font-semibold bg-[#FAF8F5] dark:bg-[#1C2622] transition ${b.color}`}
                        >
                          <div>{b.label}</div>
                          <div className="text-[10px] font-normal opacity-70">{b.sub}</div>
                        </button>
                      ))}
                    </div>
                    {ratedSample && (
                      <p className="mt-2 text-center text-xs text-[#3D6656] dark:text-[#86B8A3] font-medium">
                        ✓ Resposta registrada: card agendado conforme sua resposta.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção O Método: O Ritmo do Esquecimento e Como Superá-lo */}
      <section id="como-funciona" className="py-20 md:py-28 bg-[#F4F1EA] dark:bg-[#151B19] border-b border-[#E5E0D6] dark:border-[#202925]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16 space-y-3 reveal">
            <span className="text-xs font-mono uppercase tracking-widest text-[#567266] dark:text-[#8FB3A3]">
              01. O PROBLEMA REAL DO ESTUDO MÉDICO
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#172320] dark:text-[#F3F6F4]">
              Estudar por 8 horas seguidas e esquecer metade uma semana depois não é falha sua.
            </h2>
            <p className="text-[#55645F] dark:text-[#9DAEA8] text-base leading-relaxed">
              O cérebro foi moldado para descartar informações não revisitadas. Quando você estuda
              apenas por apostilas passivas, a curva de esquecimento atua imediatamente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#FFFFFF] dark:bg-[#1A221F] p-8 rounded-2xl border border-[#DFD9CD] dark:border-[#2B3732] space-y-4 reveal delay-100">
              <span className="text-sm font-mono text-[#8C7A5E] font-bold">ETAPA 01</span>
              <h3 className="text-xl font-serif text-[#1C2925] dark:text-[#E8EFEA]">
                Recuperação Ativa
              </h3>
              <p className="text-sm text-[#5B6A64] dark:text-[#9AA9A3] leading-relaxed">
                Em vez de reler grifos, você força o cérebro a recuperar a conduta a partir do caso.
                Essa força de resgate é o que realmente consolida as sinapses.
              </p>
            </div>

            <div className="bg-[#FFFFFF] dark:bg-[#1A221F] p-8 rounded-2xl border border-[#DFD9CD] dark:border-[#2B3732] space-y-4 reveal delay-200">
              <span className="text-sm font-mono text-[#4A7261] font-bold">ETAPA 02</span>
              <h3 className="text-xl font-serif text-[#1C2925] dark:text-[#E8EFEA]">
                Intervalo Calculado
              </h3>
              <p className="text-sm text-[#5B6A64] dark:text-[#9AA9A3] leading-relaxed">
                O algoritmo SM-2 afere a dificuldade que você teve. Se foi fácil, o card reaparece em
                12 dias; se foi difícil, em 2 dias. Nada é estudado cedo demais nem tarde demais.
              </p>
            </div>

            <div className="bg-[#FFFFFF] dark:bg-[#1A221F] p-8 rounded-2xl border border-[#DFD9CD] dark:border-[#2B3732] space-y-4 reveal delay-300">
              <span className="text-sm font-mono text-[#325244] font-bold">ETAPA 03</span>
              <h3 className="text-xl font-serif text-[#1C2925] dark:text-[#E8EFEA]">
                Paz de Espírito na Rotina
              </h3>
              <p className="text-sm text-[#5B6A64] dark:text-[#9AA9A3] leading-relaxed">
                Você não gasta energia mental planejando cronogramas confusos. Abra o aplicativo,
                responda aos cards do dia e descanse com a certeza de que sua retenção está salva.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Baralhos Clínicos: Especialidades com Identidade Sólida */}
      <section id="conteudo" className="py-20 md:py-28 border-b border-[#E8E3DB] dark:border-[#222B27]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6 reveal">
            <div className="space-y-3 max-w-xl">
              <span className="text-xs font-mono uppercase tracking-widest text-[#567266] dark:text-[#8FB3A3]">
                02. ACERVO ORGANIZADO POR ESPECIALIDADE
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#172320] dark:text-[#F3F6F4]">
                Construído em torno dos temas mais cobrados nas principais bancas.
              </h2>
            </div>
            <p className="text-sm text-[#61716B] dark:text-[#93A59E] max-w-xs">
              Decks elaborados com gabarito comentado, sem enrolação ou cartões vazios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TopicBlock
              title="Clínica Médica & ECG"
              cases="480 cartões"
              description="IAM, arritmias ventriculares, abordagem de sepse, insuficiência respiratória e distúrbios hidroeletrolíticos."
              sampleTag="Prioritário em todas as bancas"
            />
            <TopicBlock
              title="Cirurgia & Trauma"
              cases="390 cartões"
              description="Protocolo ATLS atualizado, abdome agudo cirúrgico, queimaduras, hérnias da parede abdominal e choque hemorrágico."
              sampleTag="Foco Enare e USP"
            />
            <TopicBlock
              title="Pediatria & Neonatologia"
              cases="320 cartões"
              description="Marcos do desenvolvimento, calendário vacinal PNI, desidratação na infância, reanimação neonatal em sala de parto."
              sampleTag="Alta cobrança"
            />
            <TopicBlock
              title="Ginecologia & Obstetrícia"
              cases="340 cartões"
              description="Pré-eclâmpsia, hemorragias do 1º e 3º trimestre, sangramento uterino anormal e rastreio de neoplasias ginecológicas."
              sampleTag="Condutas práticas"
            />
            <TopicBlock
              title="Farmacologia Terapêutica"
              cases="290 cartões"
              description="Escolha de antimicrobianos, dosagem empírica, anti-hipertensivos, antidiabéticos e manejo de intoxicações agudas."
              sampleTag="Essencial no internato"
            />
            <TopicBlock
              title="Preventiva & Epidemiologia"
              cases="260 cartões"
              description="Princípios e diretrizes do SUS, estudos epidemiológicos, medidas de associação, sensibilidade, especificidade e declaração de óbito."
              sampleTag="Gabaritos decisivos"
            />
          </div>
        </div>
      </section>

      {/* Seção Rotina de Revisão: Como se integra ao seu dia real */}
      <section id="rotina" className="py-20 md:py-28 bg-[#F4F1EA] dark:bg-[#151B19] border-b border-[#E5E0D6] dark:border-[#202925]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6 reveal">
              <span className="text-xs font-mono uppercase tracking-widest text-[#567266] dark:text-[#8FB3A3]">
                03. ADAPTADO À SUA VIDA
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#172320] dark:text-[#F3F6F4]">
                Feito para quem estuda no intervalo do almoço ou no trajeto para o hospital.
              </h2>
              <p className="text-base text-[#566560] dark:text-[#99AAA3] leading-relaxed">
                Você não precisa de 4 horas ininterruptas de silêncio para avançar. O algoritmo
                fatia o volume em pequenas sessões diárias que cabem na realidade de quem vive no hospital.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-[#E4DDD0] dark:bg-[#202B27] flex items-center justify-center text-xs font-bold shrink-0 text-[#2C483F] dark:text-[#A6BCB3]">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1C2825] dark:text-[#E8EFEA]">
                      Importe seus próprios materiais em .txt
                    </h4>
                    <p className="text-xs text-[#5D6D67] dark:text-[#91A29B] mt-0.5">
                      Copie suas anotações do Word ou Notion e gere baralhos em segundos com o formato simples &quot;Pergunta | Resposta&quot;.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-[#E4DDD0] dark:bg-[#202B27] flex items-center justify-center text-xs font-bold shrink-0 text-[#2C483F] dark:text-[#A6BCB3]">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1C2825] dark:text-[#E8EFEA]">
                      Simulados com tempo cronometrado
                    </h4>
                    <p className="text-xs text-[#5D6D67] dark:text-[#91A29B] mt-0.5">
                      Treine a gestão de minutos por questão com gabarito fundamentado ao final.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-[#E4DDD0] dark:bg-[#202B27] flex items-center justify-center text-xs font-bold shrink-0 text-[#2C483F] dark:text-[#A6BCB3]">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1C2825] dark:text-[#E8EFEA]">
                      Backup e exportação sem travas
                    </h4>
                    <p className="text-xs text-[#5D6D67] dark:text-[#91A29B] mt-0.5">
                      Seus dados e anotações pertencem a você. Exporte seu histórico completo em JSON quando quiser.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulação Visual de Agenda Semanal Real */}
            <div className="lg:col-span-6 reveal delay-150">
              <div className="bg-[#FFFFFF] dark:bg-[#19221F] border border-[#DDD6C8] dark:border-[#2C3B34] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#EFEBE3] dark:border-[#26342E] pb-4">
                  <div>
                    <span className="text-xs font-mono uppercase text-[#73827C]">SUA SEMANA DE REVISÃO</span>
                    <h4 className="text-base font-serif font-bold text-[#1A2623] dark:text-[#E8EFEA]">
                      Carga diária balanceada
                    </h4>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#EAF2ED] dark:bg-[#1E2E27] text-[#295642] dark:text-[#9FC6B3]">
                    88% retenção
                  </span>
                </div>

                {/* Linha dos dias */}
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium">
                  {[
                    { day: 'SEG', cards: '28', done: true },
                    { day: 'TER', cards: '34', done: true },
                    { day: 'QUA', cards: '22', done: true },
                    { day: 'QUI', cards: '40', done: true },
                    { day: 'SEX', cards: '26', done: true },
                    { day: 'SÁB', cards: '15', done: false, today: true },
                    { day: 'DOM', cards: '10', done: false },
                  ].map((d) => (
                    <div
                      key={d.day}
                      className={`p-3 rounded-xl border flex flex-col justify-between h-24 ${
                        d.today
                          ? 'border-[#264D40] dark:border-[#52806E] bg-[#F1EFEA] dark:bg-[#202E28] font-bold'
                          : d.done
                            ? 'border-[#E0D9CB] dark:border-[#283832] bg-[#FAF8F5] dark:bg-[#1C2522] text-[#697A73]'
                            : 'border-[#EAE5D9] dark:border-[#25322C] opacity-60'
                      }`}
                    >
                      <span className="text-[10px] font-mono">{d.day}</span>
                      <span className="text-base font-serif">{d.cards}</span>
                      <span className="text-[9px] uppercase tracking-wider">
                        {d.today ? 'Hoje' : d.done ? 'Concluído' : 'Previsto'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-[#F6F4EE] dark:bg-[#1E2925] border border-[#E6E0D3] dark:border-[#283731] text-xs text-[#52635D] dark:text-[#9DB0A8] flex items-center justify-between">
                  <span>Tempo médio diário de estudo esta semana:</span>
                  <span className="font-bold text-[#1C2B27] dark:text-[#E8EFEA]">22 minutos / dia</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planos Transparentes e Diretos */}
      <section id="planos" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3 reveal">
            <span className="text-xs font-mono uppercase tracking-widest text-[#567266] dark:text-[#8FB3A3]">
              04. INVESTIMENTO
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#172320] dark:text-[#F3F6F4]">
              Planos claros, sem letras miúdas ou fidelidade.
            </h2>
            <p className="text-sm text-[#5B6B65] dark:text-[#94A59E]">
              Cancele quando quiser diretamente pelo painel. Acesso em qualquer dispositivo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Gratuito */}
            <div className="bg-[#FFFFFF] dark:bg-[#18211E] p-8 rounded-2xl border border-[#DFD8CC] dark:border-[#293630] flex flex-col justify-between shadow-sm reveal delay-100">
              <div>
                <h3 className="text-xl font-serif text-[#1C2A26] dark:text-[#E8EFEA] mb-1">Gratuito</h3>
                <p className="text-xs text-[#6A7B74] mb-6">Para testar o método e seus próprios resumos.</p>
                <div className="text-3xl font-serif text-[#1C2A26] dark:text-[#E8EFEA] mb-6">
                  R$ 0 <span className="text-xs font-sans text-[#798A84]">/ sem custo</span>
                </div>
                <ul className="space-y-3 text-xs text-[#4F5E58] dark:text-[#9FB1AA] mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#4A7261] shrink-0" />
                    <span>Decks oficiais introdutórios</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#4A7261] shrink-0" />
                    <span>Até 50 flashcards próprios</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#4A7261] shrink-0" />
                    <span>5 simulados mensais</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#4A7261] shrink-0" />
                    <span>Algoritmo SM-2 completo</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleQuickDemo('student')}
                className="w-full py-3 rounded-xl border border-[#C5BCAC] dark:border-[#384841] text-xs font-semibold text-[#1C2B27] dark:text-[#DCE8E2] hover:bg-[#F3EFE7] dark:hover:bg-[#202C27] transition"
              >
                Começar gratuitamente
              </button>
            </div>

            {/* Básico */}
            <div className="bg-[#FFFFFF] dark:bg-[#18211E] p-8 rounded-2xl border border-[#DFD8CC] dark:border-[#293630] flex flex-col justify-between shadow-sm reveal delay-200">
              <div>
                <h3 className="text-xl font-serif text-[#1C2A26] dark:text-[#E8EFEA] mb-1">Básico</h3>
                <p className="text-xs text-[#6A7B74] mb-6">Para quem está no internato e precisa de consistência.</p>
                <div className="text-3xl font-serif text-[#1C2A26] dark:text-[#E8EFEA] mb-6">
                  R$ 29,90 <span className="text-xs font-sans text-[#798A84]">/ mês</span>
                </div>
                <ul className="space-y-3 text-xs text-[#4F5E58] dark:text-[#9FB1AA] mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#4A7261] shrink-0" />
                    <span>Acesso aos baralhos intermediários</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#4A7261] shrink-0" />
                    <span>Até 500 cartões próprios</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#4A7261] shrink-0" />
                    <span>50 simulados mensais</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#4A7261] shrink-0" />
                    <span>Estatísticas por especialidade</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="w-full py-3 rounded-xl border border-[#1A3835] text-xs font-semibold text-[#1A3835] dark:text-[#E8EFEA] dark:border-[#3D5E56] hover:bg-[#EAE5DB] dark:hover:bg-[#21302A] transition text-center"
              >
                Assinar Básico
              </Link>
            </div>

            {/* Premium - Destaque Sóbrio */}
            <div className="bg-[#1A3835] dark:bg-[#1F332E] text-[#FAF8F5] p-8 rounded-2xl border border-[#2D544C] flex flex-col justify-between shadow-md reveal delay-300 relative">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-[#E5D7C2] text-[#1B322C] text-[10px] font-mono font-bold uppercase tracking-wider">
                Mais Escolhido
              </div>
              <div>
                <h3 className="text-xl font-serif text-[#FAF8F5] mb-1">Premium</h3>
                <p className="text-xs text-[#A8BEB6] mb-6">Para candidatos em reta final de Residência e Revalida.</p>
                <div className="text-3xl font-serif text-[#FAF8F5] mb-6">
                  R$ 49,90 <span className="text-xs font-sans text-[#A8BEB6]">/ mês</span>
                </div>
                <ul className="space-y-3 text-xs text-[#D5E2DC] mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#8FC0AC] shrink-0" />
                    <span>Acesso irrestrito a 100% dos baralhos oficiais</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#8FC0AC] shrink-0" />
                    <span>Criação e importação ilimitada de cartões</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#8FC0AC] shrink-0" />
                    <span>Simulados ilimitados com gabarito comentado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#8FC0AC] shrink-0" />
                    <span>Exportação de dados em JSON</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleQuickDemo('student')}
                className="w-full py-3.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE0] text-[#1A3835] text-xs font-bold transition shadow-sm"
              >
                Experimentar com Acesso Total
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé Calmo e Elegante */}
      <footer className="border-t border-[#E5E0D8] dark:border-[#222B27] py-14 bg-[#F6F3EB] dark:bg-[#111514] text-xs text-[#6B7B75] dark:text-[#889B94]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#E8E2D6] dark:border-[#1E2723]">
            <MedFocusLogo size="sm" showBadge={false} />

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium">
              <a href="#como-funciona" className="hover:text-[#1A3835] dark:hover:text-[#FAF8F5] transition">
                Metodologia SM-2
              </a>
              <a href="#conteudo" className="hover:text-[#1A3835] dark:hover:text-[#FAF8F5] transition">
                Especialidades
              </a>
              <a href="#planos" className="hover:text-[#1A3835] dark:hover:text-[#FAF8F5] transition">
                Planos
              </a>
              <button
                onClick={() => handleQuickDemo('admin')}
                className="hover:text-[#1A3835] dark:hover:text-[#FAF8F5] transition text-[11px] underline"
              >
                Ambiente de Coordenação / Admin
              </button>
            </div>

            {/* Botão Instagram MedFocus */}
            <a
              href="https://instagram.com/medfocuscards"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram MedFocus Cards"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#DDD6C8] dark:border-[#2A3731] bg-[#FAF8F5] dark:bg-[#18211E] hover:border-[#1A3835] dark:hover:border-[#8FB3A3] text-[#1A3835] dark:text-[#FAF8F5] transition shadow-xs group"
            >
              <Instagram className="w-4 h-4 text-[#C47253] group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-xs tracking-tight">@medfocuscards</span>
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#7A8A83] dark:text-[#72857D]">
            <div>
              © {new Date().getFullYear()} MedFocus Medical Education. Todos os direitos reservados.
            </div>
            <div className="flex items-center gap-4">
              <span className="hover:text-[#1A3835] dark:hover:text-[#FAF8F5] cursor-pointer">
                Termos de Uso
              </span>
              <span>•</span>
              <span className="hover:text-[#1A3835] dark:hover:text-[#FAF8F5] cursor-pointer">
                Privacidade & LGPD
              </span>
              <span>•</span>
              <span className="hover:text-[#1A3835] dark:hover:text-[#FAF8F5] cursor-pointer">
                Suporte Clínico
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const TopicBlock = ({ title, cases, description, sampleTag }) => (
  <div className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#18211E] border border-[#DDD6C8] dark:border-[#2A3731] space-y-3 hover:border-[#4B7362] transition duration-200 shadow-sm reveal">
    <div className="flex items-center justify-between text-xs">
      <span className="font-mono text-[#7D8E87] dark:text-[#859891]">{cases}</span>
      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F2EFE8] dark:bg-[#202C26] text-[#4F6D60] dark:text-[#9ABEB0] border border-[#DDD6C7] dark:border-[#2A3A33]">
        {sampleTag}
      </span>
    </div>
    <h3 className="text-lg font-serif font-bold text-[#192723] dark:text-[#E8EFEA]">{title}</h3>
    <p className="text-xs text-[#596963] dark:text-[#95A7A0] leading-relaxed">{description}</p>
  </div>
);

export default Home;
