import Image from "next/image";
import Link from "next/link";
import { Award, Clock3, MapPin, Sparkles, Star, Users } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { buildPageMetadata, getHomepageData } from "@/lib/site-data";
import { formatPrice, weekdayLabel } from "@/lib/utils";

export async function generateMetadata() {
  return buildPageMetadata("home");
}

export default async function HomePage() {
  const data = await getHomepageData();
  const featuredServices = data.categories.flatMap((category) => category.services).slice(0, 4);
  const featuredGallery = data.gallery.slice(0, 3);
  const featuredTestimonials = data.testimonials.filter((item) => item.isFeatured).slice(0, 3);

  return (
    <div>
      <section className="section-space pt-10 md:pt-16">
        <div className="container-shell grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary-strong">
              <Sparkles className="h-4 w-4" /> Design premium e serviço personalizado
            </div>
            <div className="space-y-5">
              <h1 className="max-w-3xl font-[family-name:var(--font-geist-mono)] text-6xl leading-[0.95] text-foreground md:text-7xl">
                {data.hero?.title}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted">{data.hero?.subtitle}</p>
              <p className="max-w-2xl text-base leading-8 text-muted">{data.hero?.content}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/marcacoes" className="rounded-full bg-foreground px-6 py-4 text-sm font-semibold text-white">
                Marcar Agora
              </Link>
              <Link href="/servicos" className="rounded-full border border-line bg-surface px-6 py-4 text-sm font-semibold text-foreground">
                Ver serviços
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Award, label: "Acabamento premium" },
                { icon: Users, label: "Equipa especializada" },
                { icon: Clock3, label: "Agenda organizada" },
              ].map((item) => (
                <div key={item.label} className="section-card rounded-[1.75rem] p-5">
                  <item.icon className="h-5 w-5 text-primary-strong" />
                  <p className="mt-3 text-sm font-semibold text-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-10 h-28 w-28 rounded-full bg-accent-soft blur-3xl" />
            <div className="section-card gold-outline relative overflow-hidden rounded-[2.5rem] p-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
                <Image src={data.hero?.imageUrl ?? data.settings.heroImageUrl} alt="Hero do salão" fill priority className="object-cover" />
              </div>
              {data.banners[0] ? (
                <div className="absolute bottom-8 left-8 right-8 rounded-[1.75rem] bg-white/92 p-5 shadow-2xl backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-strong">Destaque</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{data.banners[0].title}</p>
                  <p className="mt-1 text-sm leading-7 text-muted">{data.banners[0].subtitle}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="container-shell grid gap-6 lg:grid-cols-[0.8fr,1.2fr] lg:items-end">
          <SectionHeading
            eyebrow="Sobre o espaço"
            title={data.about?.title ?? "Um atelier desenhado para o detalhe."}
            description={data.about?.content}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              "Higiene rigorosa e materiais selecionados.",
              "Atendimento calmo, organizado e pontual.",
              "Consultoria estética antes de cada serviço.",
            ].map((text) => (
              <div key={text} className="section-card rounded-[1.75rem] p-6 text-sm leading-7 text-muted">
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="container-shell space-y-10">
          <SectionHeading
            eyebrow="Serviços em destaque"
            title="Resultados elegantes para diferentes estilos e rotinas."
            description="Preços transparentes, descrição clara e tempos realistas para cada atendimento."
          />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featuredServices.map((service) => (
              <article key={service.id} className="section-card overflow-hidden rounded-[2rem]">
                <div className="relative aspect-[4/3]">
                  <Image src={service.imageUrl ?? data.settings.heroImageUrl} alt={service.name} fill className="object-cover" />
                </div>
                <div className="space-y-4 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-semibold text-foreground">{service.name}</h3>
                    <span className="text-sm font-semibold text-primary-strong">{formatPrice(service.price)}</span>
                  </div>
                  <p className="text-sm leading-7 text-muted">{service.description}</p>
                  <div className="flex items-center justify-between text-sm text-muted">
                    <span>{service.durationMinutes} min</span>
                    <Link href="/marcacoes" className="font-semibold text-foreground">Marcar</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="container-shell grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="grid gap-6 md:grid-cols-3">
            {featuredGallery.map((item) => (
              <article key={item.id} className="section-card overflow-hidden rounded-[2rem]">
                <div className="relative aspect-[4/5]">
                  <Image src={item.imageUrl} alt={item.altText ?? item.title} fill className="object-cover" />
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-strong">{item.category}</p>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">{item.title}</h3>
                </div>
              </article>
            ))}
          </div>
          <div className="section-card rounded-[2rem] p-8">
            <SectionHeading
              eyebrow="Trabalhos recentes"
              title="Portfólio real com acabamento editorial e feminino."
              description="Explore texturas, tons suaves, french contemporânea e composições artísticas feitas no atelier."
            />
            <Link href="/galeria" className="mt-8 inline-flex rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-white">
              Ver galeria completa
            </Link>
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="container-shell space-y-8">
          <SectionHeading
            eyebrow="Testemunhos"
            title="Clientes que regressam pela qualidade e pela experiência."
            description="A confiança constrói-se com consistência, cuidado técnico e uma agenda simples de utilizar."
            align="center"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {featuredTestimonials.map((testimonial) => (
              <article key={testimonial.id} className="section-card rounded-[2rem] p-8">
                <div className="mb-4 flex gap-1 text-accent">
                  {Array.from({ length: testimonial.rating }).map((_, index) => (
                    <Star key={`${testimonial.id}-${index}`} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-base leading-8 text-muted">“{testimonial.comment}”</p>
                <p className="mt-6 text-sm font-semibold text-foreground">{testimonial.clientName}</p>
                <p className="text-sm text-muted">{testimonial.serviceName}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="container-shell grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="section-card rounded-[2rem] p-8">
            <SectionHeading
              eyebrow="Novidades"
              title="Promoções e campanhas ativas."
              description="Destaques sazonais que o admin pode ativar, editar e desativar no painel."
            />
            <div className="mt-8 space-y-4">
              {data.promotions.map((promotion) => (
                <div key={promotion.id} className="rounded-[1.5rem] border border-line bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-strong">{promotion.badge}</p>
                  <h3 className="mt-2 text-xl font-semibold text-foreground">{promotion.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted">{promotion.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="section-card rounded-[2rem] p-8">
              <SectionHeading
                eyebrow="Horários e localização"
                title="Chegue com tudo planeado."
                description="Horários claros, localização fácil e contacto rápido por vários canais."
              />
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="space-y-3 text-sm leading-7 text-muted">
                  <p>
                    <MapPin className="mr-2 inline h-4 w-4 text-primary-strong" /> {data.settings.address}, {data.settings.postalCode} {data.settings.city}
                  </p>
                  <p>
                    <Clock3 className="mr-2 inline h-4 w-4 text-primary-strong" /> Horário geral
                  </p>
                  <div className="space-y-2">
                      {data.hours.map((hour, index) => (
                        <div key={`${hour.weekday}-${hour.opensAt}-${hour.closesAt}-${index}`} className="flex items-center justify-between gap-4 border-b border-line pb-2">
                        <span>{weekdayLabel(hour.weekday)}</span>
                        <span>{hour.isClosed ? "Fechado" : `${hour.opensAt} - ${hour.closesAt}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid-fade rounded-[1.75rem] border border-line bg-white p-6 text-sm leading-7 text-muted">
                  <p className="font-semibold text-foreground">Contactos rápidos</p>
                  <p className="mt-4">Telefone: {data.settings.phone}</p>
                  <p>Email: {data.settings.businessEmail}</p>
                  <p>WhatsApp: {data.settings.whatsapp}</p>
                  <div className="mt-6 flex gap-3">
                    <Link href="/contactos" className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white">
                      Falar connosco
                    </Link>
                    <Link href="/marcacoes" className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-foreground">
                      Reservar
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="section-card rounded-[2rem] p-8">
              <SectionHeading
                eyebrow="Equipa"
                title="Profissionais com especialidades distintas e agenda organizada."
              />
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {data.professionals.map((professional) => (
                  <article key={professional.id} className="rounded-[1.5rem] border border-line bg-white p-5">
                    <p className="text-lg font-semibold text-foreground">{professional.name}</p>
                    <p className="mt-1 text-sm text-primary-strong">{professional.specialty}</p>
                    <p className="mt-3 text-sm leading-7 text-muted">{professional.bio}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
