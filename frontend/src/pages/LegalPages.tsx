import { CONTACT_EMAIL as OFFICIAL_CONTACT_EMAIL } from '../config/contact';
import { useCallback, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { legalMessages } from '../i18n/legal';
import { CalendarIcon, DownloadIcon, ShieldIcon } from '../components/brand/icons';

// Documentos legales de XploraSG (versión 2.0, 31 oct 2026).
// Redactados conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares
// publicada en el DOF el 20 de marzo de 2025. Al ser un prototipo académico, conviene que los revise
// el tutor o el área jurídica de la institución antes de una publicación comercial.
const CONTACT_EMAIL_ENV = (import.meta.env.VITE_CONTACTO_PRIVACIDAD as string | undefined) || OFFICIAL_CONTACT_EMAIL;

const tocMessages = defineMessages({
  onThisPage: 'Contenido',
}, {
  onThisPage: 'Contents',
});

type TocItem = { id: string; label: string };

const LegalLayout = ({ eyebrow, title, summary, children }: { eyebrow: string; title: string; summary?: ReactNode; children: ReactNode }) => {
  const m = useMessages(legalMessages);
  const t = useMessages(tocMessages);
  const [toc, setToc] = useState<TocItem[]>([]);

  // Índice generado a partir de los subtítulos del documento (se asignan anclas estables).
  const contentRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const items = Array.from(node.querySelectorAll('h2')).map((heading, index) => {
      const id = `seccion-${index + 1}`;
      heading.id = id;
      return { id, label: heading.textContent ?? '' };
    });
    setToc(items);
  }, []);

  return (
    <section className="legal-doc mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
      <header className="rounded-[1.75rem] bg-brand-blue px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-14">
        <p className="flex items-center gap-3 text-sm text-white/75">
          <ShieldIcon className="size-4" />
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl text-[2.25rem] leading-[1.05] sm:text-5xl lg:text-[3.25rem]">{title}</h1>
        <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/80">
          <div className="flex items-center gap-2"><dt className="sr-only">Versión</dt><dd className="rounded-full bg-white/12 px-3 py-1 font-medium text-white">{m.version}</dd></div>
          <div className="flex items-center gap-2"><CalendarIcon className="size-4" /><dd>{m.lastUpdated}</dd></div>
          <div className="flex items-center gap-2"><dd>{m.responsible}</dd></div>
        </dl>
        <button
          type="button"
          onClick={() => window.print()}
          className="legal-noprint mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-brand-blue transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0"
        >
          <DownloadIcon className="size-4" />
          {m.print}
        </button>
        {m.discrepancyNote && (
          <p className="mt-6 max-w-2xl border-l-2 border-white/40 pl-4 text-sm leading-6 text-white/75">{m.discrepancyNote}</p>
        )}
      </header>

      {summary && (
        <aside className="mt-8 rounded-2xl border border-brand-green/25 bg-brand-light px-6 py-6 sm:px-8" aria-label={m.summaryTitle}>
          <p className="text-sm font-semibold text-brand-green">{m.summaryTitle}</p>
          <div className="mt-3 text-base leading-7 text-brand-blue/85 [&_a]:font-medium [&_a]:text-brand-green [&_a]:underline [&_a]:underline-offset-4">{summary}</div>
        </aside>
      )}

      <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-8">
        {toc.length > 0 && (
          <nav aria-label={t.onThisPage} className="legal-noprint lg:sticky lg:top-28 lg:col-span-3 lg:h-fit">
            <p className="label-quiet">{t.onThisPage}</p>
            <ol className="mt-4 rounded-2xl bg-white p-2 ring-1 ring-brand-blue/8">
              {toc.map(({ id, label }) => (
                <li key={id}>
                  <a href={`#${id}`} className="block rounded-xl px-3 py-2 text-label leading-5 text-brand-blue/75 transition-colors duration-300 hover:bg-brand-light hover:text-brand-green">
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div
          ref={contentRef}
          className="grid max-w-[72ch] gap-4 text-base leading-7 text-brand-blue/80 sm:leading-8 lg:col-span-8 lg:col-start-5 [&_a]:font-medium [&_a]:text-brand-green [&_a]:underline [&_a]:decoration-brand-green/30 [&_a]:underline-offset-4 [&_h2]:mt-8 [&_h2]:scroll-mt-28 [&_h2]:border-t [&_h2]:border-brand-sand [&_h2]:pt-8 [&_h2]:font-display [&_h2]:text-[1.45rem] [&_h2]:leading-tight [&_h2]:text-brand-blue [&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-brand-blue [&_li]:relative [&_li]:pl-6 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.8em] [&_li]:before:size-1.5 [&_li]:before:rounded-full [&_li]:before:bg-brand-gold [&_ol]:grid [&_ol]:gap-2 [&_strong]:font-semibold [&_strong]:text-brand-blue [&_ul]:grid [&_ul]:gap-2"
        >
          {children}
        </div>
      </div>
    </section>
  );
};

export const PrivacyPage = () => {
  const m = useMessages(legalMessages);
  const { lang } = useLanguage();
  usePageTitle(m.privacyTitle);
  const email = CONTACT_EMAIL_ENV || m.contactPlaceholder;
  const summary = lang === 'en' ? (
    <p>
      The <strong>XploraSG development team</strong> processes your personal data to create and manage your account, save your favorites and,
      only when you ask for it, show you nearby places, routes and weather. We do not sell your data or use it for advertising. You can exercise
      your ARCO rights at <a href={`mailto:${email}`}>{email}</a>. The full notice is below.
    </p>
  ) : (
    <p>
      El <strong>Equipo de desarrollo XploraSG</strong> trata tus datos personales para crear y administrar tu cuenta, guardar tus favoritos y,
      sólo cuando lo solicitas, mostrarte lugares cercanos, rutas y clima. No vendemos tus datos ni los usamos con fines publicitarios. Puedes
      ejercer tus derechos ARCO en <a href={`mailto:${email}`}>{email}</a>. Consulta el aviso integral a continuación.
    </p>
  );
  return (
    <LegalLayout eyebrow={m.privacyEyebrow} title={m.privacyTitle} summary={summary}>
      {lang === 'en' ? <PrivacyEn email={email} /> : <PrivacyEs email={email} />}
    </LegalLayout>
  );
};

const PrivacyEs = ({ email }: { email: string }) => (
  <>
    <p>
      En cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (DOF, 20 de marzo de 2025), su
      Reglamento y demás normativa aplicable, se pone a disposición de las personas usuarias el presente Aviso de privacidad integral de la
      plataforma <strong>XploraSG – Plataforma de Turismo Inteligente para la Sierra Gorda</strong>.
    </p>

    <h2>I. Identidad y domicilio del responsable</h2>
    <p>
      El responsable del tratamiento de los datos personales es el <strong>Equipo de desarrollo XploraSG</strong>, grupo de estudiantes que desarrolla
      la plataforma como proyecto del Programa Nuevos Talentos Científicos y Tecnológicos 2026, con domicilio para oír y recibir notificaciones en
      Jalpan de Serra, Querétaro, C.P. 76340, México, y correo electrónico de contacto <a href={`mailto:${email}`}>{email}</a>.
    </p>

    <h2>II. Datos personales que se recaban</h2>
    <p>Para las finalidades descritas en este aviso se pueden tratar las siguientes categorías de datos personales:</p>
    <ul>
      <li><strong>Identificación y contacto:</strong> nombre y correo electrónico, únicamente si creas una cuenta.</li>
      <li><strong>Autenticación:</strong> contraseña, que se almacena cifrada mediante una función de resumen (hash) y que el equipo no puede conocer.</li>
      <li><strong>Preferencias:</strong> lugares guardados como favoritos e idioma de consulta.</li>
      <li><strong>Ubicación aproximada:</strong> sólo cuando pulsas «Usar mi ubicación»; se usa en el momento y no se almacena.</li>
      <li><strong>Datos de prestadores de servicios:</strong> información comercial que el propio prestador decide publicar (nombre del negocio, teléfono, horarios y precios).</li>
    </ul>
    <p>
      XploraSG <strong>no recaba datos personales sensibles</strong>. La encuesta de satisfacción y las estadísticas de uso son anónimas y no permiten
      identificar a ninguna persona.
    </p>

    <h2>III. Finalidades del tratamiento</h2>
    <h3>Finalidades primarias (necesarias para el servicio)</h3>
    <ul>
      <li>Crear, autenticar y administrar tu cuenta de usuario.</li>
      <li>Guardar y sincronizar tus lugares favoritos.</li>
      <li>Mostrar lugares cercanos, rutas y clima cuando lo solicitas.</li>
      <li>Atender solicitudes, dudas y reportes enviados al equipo.</li>
      <li>Publicar la oferta de los prestadores de servicios turísticos registrados.</li>
    </ul>
    <h3>Finalidades secundarias (no necesarias para el servicio)</h3>
    <ul>
      <li>Elaborar estadísticas anónimas para evaluar y mejorar el prototipo y para fines académicos y de divulgación científica.</li>
    </ul>
    <p>
      Si no deseas que tus datos se traten para las finalidades secundarias, puedes manifestarlo en cualquier momento escribiendo a
      {' '}<a href={`mailto:${email}`}>{email}</a>. Tu negativa no será motivo para negarte el servicio.
    </p>

    <h2>IV. Transferencias y remisiones de datos</h2>
    <p>
      XploraSG <strong>no vende, renta ni transfiere</strong> tus datos personales a terceros. Para operar, el responsable se apoya en proveedores
      que actúan como encargados y tratan los datos únicamente por cuenta y bajo instrucciones del responsable:
    </p>
    <ul>
      <li><strong>Supabase:</strong> base de datos, autenticación y almacenamiento de archivos (cifrado en tránsito y en reposo).</li>
      <li><strong>Proveedor de alojamiento del servidor:</strong> ejecución de la aplicación.</li>
      <li><strong>OpenStreetMap, OpenRouteService y Open-Meteo:</strong> mapas, rutas y clima; reciben sólo coordenadas, nunca tu nombre o correo.</li>
      <li><strong>Proveedor de inteligencia artificial</strong> (cuando está configurado): recibe sólo el texto de tu pregunta y datos públicos del catálogo.</li>
    </ul>
    <p>
      Al pulsar «Reservar / Contactar» se abre WhatsApp. A partir de ese momento la comunicación se rige por el aviso de privacidad de WhatsApp
      y del prestador con el que contactes.
    </p>

    <h2>V. Derechos ARCO</h2>
    <p>
      Tienes derecho a <strong>acceder</strong> a tus datos personales, <strong>rectificarlos</strong> si son inexactos, <strong>cancelarlos</strong>
      cuando consideres que no se requieren para alguna de las finalidades y <strong>oponerte</strong> a su tratamiento para fines específicos.
    </p>
    <h3>Procedimiento</h3>
    <ol>
      <li>Envía tu solicitud a <a href={`mailto:${email}`}>{email}</a> con el asunto «Solicitud ARCO».</li>
      <li>Incluye tu nombre, el correo asociado a tu cuenta, una descripción clara de los datos y del derecho que deseas ejercer y, en su caso, los documentos que acrediten tu identidad o la de tu representante.</li>
      <li>El responsable te comunicará su respuesta en un plazo máximo de <strong>20 días hábiles</strong> contados desde la recepción de la solicitud.</li>
      <li>Si la solicitud resulta procedente, se hará efectiva dentro de los <strong>15 días hábiles</strong> siguientes a la respuesta.</li>
    </ol>
    <p>Tus lugares favoritos puedes quitarlos en cualquier momento desde la sección «Favoritos». La cancelación de la cuenta se realiza mediante este mismo procedimiento.</p>

    <h2>VI. Revocación del consentimiento y limitación del uso</h2>
    <p>
      Puedes revocar el consentimiento otorgado para el tratamiento de tus datos, así como limitar su uso o divulgación, mediante el mismo
      procedimiento descrito en la sección anterior. La revocación no tendrá efectos retroactivos y, en algunos casos, podría impedir que
      sigamos prestándote el servicio, por ejemplo, la sincronización de favoritos.
    </p>

    <h2>VII. Uso de tecnologías de almacenamiento</h2>
    <p>
      XploraSG utiliza el almacenamiento local del navegador (localStorage e IndexedDB) para mantener tu sesión, guardar favoritos sin cuenta y
      conservar una copia del catálogo para su consulta sin conexión. <strong>No se utilizan cookies publicitarias ni de rastreo de terceros.</strong>
      Puedes borrar esta información desde la configuración de tu navegador. Por seguridad, la sesión se cierra automáticamente tras 15 minutos
      de inactividad.
    </p>

    <h2>VIII. Medidas de seguridad</h2>
    <p>
      El responsable aplica medidas de seguridad administrativas, técnicas y físicas para proteger los datos personales contra daño, pérdida,
      alteración, destrucción o uso, acceso o tratamiento no autorizado, entre ellas: conexiones cifradas (HTTPS/TLS), contraseñas cifradas,
      control de acceso por roles y políticas de seguridad a nivel de fila en la base de datos.
    </p>

    <h2>IX. Personas menores de edad</h2>
    <p>
      XploraSG no está dirigido a personas menores de 18 años. Si eres menor de edad, crea una cuenta sólo con el consentimiento de tu madre,
      padre o tutor. Si detectamos datos de una persona menor sin dicho consentimiento, los eliminaremos.
    </p>

    <h2>X. Cambios al aviso de privacidad</h2>
    <p>
      Este aviso puede modificarse por cambios legales, por nuevas funciones de la plataforma o por cambios en los proveedores. Cualquier
      modificación se publicará en esta misma página, indicando la versión y la fecha de la última actualización.
    </p>

    <h2>XI. Autoridad competente</h2>
    <p>
      Si consideras que tu derecho a la protección de datos personales ha sido vulnerado, puedes acudir ante la autoridad garante en materia de
      protección de datos personales en posesión de los particulares, que actualmente es la Secretaría Anticorrupción y Buen Gobierno.
    </p>

    <p className="mt-4 text-sm">Consulta también los <Link to="/terminos">Términos y condiciones de uso</Link>.</p>
  </>
);

export const TermsPage = () => {
  const m = useMessages(legalMessages);
  const { lang } = useLanguage();
  usePageTitle(m.termsTitle);
  const email = CONTACT_EMAIL_ENV || m.contactPlaceholder;
  return (
    <LegalLayout eyebrow={m.termsEyebrow} title={m.termsTitle}>
      {lang === 'en' ? <TermsEn email={email} /> : <TermsEs email={email} />}
    </LegalLayout>
  );
};

const TermsEs = ({ email }: { email: string }) => (
  <>
    <p>
      Los presentes Términos y condiciones regulan el acceso y uso de la plataforma <strong>XploraSG – Plataforma de Turismo Inteligente para la
      Sierra Gorda</strong> (en adelante, «la Plataforma»), desarrollada por el Equipo de desarrollo XploraSG (en adelante, «el Equipo»). Al acceder
      o utilizar la Plataforma, la persona usuaria acepta íntegramente estos términos. Si no está de acuerdo, deberá abstenerse de utilizarla.
    </p>

    <h2>1. Definiciones</h2>
    <ul>
      <li><strong>Usuario o usuaria:</strong> toda persona que accede a la Plataforma, con o sin cuenta.</li>
      <li><strong>Prestador:</strong> persona o negocio que ofrece servicios turísticos (hospedaje, alimentos, guías, tours) y cuya información se publica en la Plataforma.</li>
      <li><strong>Contenido:</strong> textos, fichas, fotografías, mapas, eventos y demás información disponible en la Plataforma.</li>
      <li><strong>Chatboot:</strong> asistente virtual de la Plataforma que responde con base en las fichas del catálogo.</li>
    </ul>

    <h2>2. Naturaleza del servicio</h2>
    <p>
      La Plataforma es un <strong>prototipo académico sin fines de lucro</strong>, desarrollado dentro del Programa Nuevos Talentos Científicos y
      Tecnológicos 2026, cuyo objetivo es difundir el turismo sustentable de la Sierra Gorda Queretana y conectar a visitantes con prestadores
      comunitarios. El acceso es gratuito.
    </p>

    <h2>3. Registro y cuentas</h2>
    <ul>
      <li>El registro es opcional y sólo se requiere para sincronizar favoritos entre dispositivos.</li>
      <li>La persona usuaria debe proporcionar información veraz y es responsable de la confidencialidad de su contraseña.</li>
      <li>Las cuentas de prestador son otorgadas por el Equipo, previa verificación de la información del negocio.</li>
      <li>El Equipo podrá suspender o cancelar cuentas que incumplan estos términos.</li>
    </ul>

    <h2>4. Uso permitido</h2>
    <p>La persona usuaria se compromete a utilizar la Plataforma de forma lícita y, en particular, a no:</p>
    <ul>
      <li>Publicar o enviar información falsa, ofensiva, discriminatoria o que ponga en riesgo a terceros.</li>
      <li>Intentar acceder a áreas restringidas, alterar el funcionamiento de la Plataforma o vulnerar sus medidas de seguridad.</li>
      <li>Extraer el contenido de forma masiva o automatizada, o utilizarlo con fines comerciales sin autorización.</li>
      <li>Suplantar la identidad de otra persona o de un prestador.</li>
    </ul>

    <h2>5. Información de lugares y servicios</h2>
    <p>
      La información de lugares, horarios, costos, accesos, eventos y servicios proviene de fuentes públicas, de trabajo de campo y de los propios
      prestadores, y se revisa antes de publicarse. Aun así, puede cambiar sin previo aviso. <strong>La persona usuaria debe confirmar horarios,
      accesos y condiciones antes de viajar.</strong>
    </p>

    <h2>6. Reservas y relación con prestadores</h2>
    <p>
      Las reservas y pagos se acuerdan directamente entre la persona usuaria y cada prestador, por ejemplo por WhatsApp. El Equipo <strong>no cobra
      comisiones, no procesa pagos y no es parte</strong> de los acuerdos entre turistas y prestadores, por lo que no responde por la calidad,
      precio o cumplimiento de los servicios contratados. Las promociones están sujetas a la disponibilidad de cada prestador.
    </p>

    <h2>7. Asistente virtual</h2>
    <p>
      Las respuestas de Chatboot se generan automáticamente con base en las fichas verificadas del catálogo y en el pronóstico del clima. Tienen
      carácter <strong>orientativo</strong> y no sustituyen la información oficial de autoridades, guías o prestadores.
    </p>

    <h2>8. Seguridad en las visitas</h2>
    <p>
      Las actividades en ríos, cañones, cascadas, sótanos y montaña implican riesgos. La persona usuaria asume la responsabilidad de sus recorridos,
      debe atender las indicaciones de guías locales y autoridades, consultar el clima y evitar visitar estos sitios con lluvia o crecientes.
    </p>

    <h2>9. Limitación de responsabilidad</h2>
    <p>
      La Plataforma se ofrece «tal cual», como prototipo en evaluación. El Equipo no garantiza su disponibilidad ininterrumpida ni la ausencia de
      errores, y no será responsable por daños derivados del uso de la información publicada, de interrupciones del servicio o de los acuerdos
      celebrados con prestadores.
    </p>

    <h2>10. Propiedad intelectual</h2>
    <p>
      El nombre, la marca, el logotipo, la mascota, los textos originales y el código de XploraSG son obra del Equipo. Algunas fotografías del
      catálogo provienen de fuentes públicas o de los propios prestadores y conservan los derechos de sus autores; se sustituyen progresivamente
      por fotografías propias. Si eres titular de alguna imagen y deseas que se retire o se acredite, escribe a <a href={`mailto:${email}`}>{email}</a>
      {' '}y se atenderá a la brevedad.
    </p>

    <h2>11. Respeto cultural y ambiental</h2>
    <p>
      Las misiones franciscanas son templos en uso y Patrimonio Mundial de la UNESCO; el arte rupestre y las zonas arqueológicas están protegidos
      por la ley. La persona usuaria se compromete a no extraer materiales, no dejar residuos y respetar a las comunidades que visite.
    </p>

    <h2>12. Datos personales</h2>
    <p>El tratamiento de datos personales se rige por el <Link to="/privacidad">Aviso de privacidad integral</Link>.</p>

    <h2>13. Modificaciones</h2>
    <p>
      El Equipo podrá modificar estos términos en cualquier momento. La versión vigente se publicará en esta página con su fecha de actualización;
      el uso posterior de la Plataforma implica la aceptación de los cambios.
    </p>

    <h2>14. Legislación aplicable y jurisdicción</h2>
    <p>
      Estos términos se rigen por las leyes federales de los Estados Unidos Mexicanos. Para su interpretación y cumplimiento, las partes se someten
      a los tribunales competentes del estado de Querétaro, renunciando a cualquier otro fuero que pudiera corresponderles.
    </p>

    <h2>15. Contacto</h2>
    <p>Para dudas, reportes o solicitudes relacionadas con estos términos, escribe a <a href={`mailto:${email}`}>{email}</a>.</p>
  </>
);

// ---- English version (courtesy translation; the Spanish text prevails) ----

const PrivacyEn = ({ email }: { email: string }) => (
  <>
    <p>
      In compliance with Mexico’s Federal Law on the Protection of Personal Data Held by Private Parties (published March 20, 2025), its
      Regulations and other applicable rules, this Comprehensive privacy notice is made available to users of <strong>XploraSG – Smart Tourism
      Platform for the Sierra Gorda</strong>.
    </p>

    <h2>I. Identity and address of the data controller</h2>
    <p>
      The data controller is the <strong>XploraSG development team</strong>, a group of students developing the platform as a project of the
      Nuevos Talentos Científicos y Tecnológicos 2026 program, with an address for notices in Jalpan de Serra, Querétaro, ZIP 76340, Mexico, and
      contact email <a href={`mailto:${email}`}>{email}</a>.
    </p>

    <h2>II. Personal data collected</h2>
    <ul>
      <li><strong>Identification and contact:</strong> name and email address, only if you create an account.</li>
      <li><strong>Authentication:</strong> your password, stored as a one-way hash that the team cannot read.</li>
      <li><strong>Preferences:</strong> places saved as favorites and display language.</li>
      <li><strong>Approximate location:</strong> only when you tap “Use my location”; it is used at that moment and not stored.</li>
      <li><strong>Local business data:</strong> business information that each business chooses to publish (name, phone, hours and prices).</li>
    </ul>
    <p>XploraSG <strong>does not collect sensitive personal data</strong>. The satisfaction survey and usage statistics are anonymous.</p>

    <h2>III. Purposes of processing</h2>
    <h3>Primary purposes (required for the service)</h3>
    <ul>
      <li>Creating, authenticating and managing your account.</li>
      <li>Saving and syncing your favorite places.</li>
      <li>Showing nearby places, routes and weather when you ask for them.</li>
      <li>Responding to requests, questions and reports.</li>
      <li>Publishing the offerings of registered local businesses.</li>
    </ul>
    <h3>Secondary purposes (not required for the service)</h3>
    <ul>
      <li>Producing anonymous statistics to evaluate and improve the prototype and for academic and science-communication purposes.</li>
    </ul>
    <p>You can opt out of secondary purposes at any time by writing to <a href={`mailto:${email}`}>{email}</a>; this will not affect the service.</p>

    <h2>IV. Transfers and processors</h2>
    <p>
      XploraSG <strong>does not sell, rent or transfer</strong> your personal data. It relies on processors that act only on the controller’s
      behalf: Supabase (database, authentication and storage), the server hosting provider, OpenStreetMap, OpenRouteService and Open-Meteo
      (coordinates only), and, when configured, an artificial intelligence provider (question text and public catalog data only). Tapping
      “Book / Contact” opens WhatsApp, which is governed by its own privacy notice.
    </p>

    <h2>V. ARCO rights</h2>
    <p>You may <strong>access</strong>, <strong>rectify</strong> or <strong>cancel</strong> your personal data, or <strong>object</strong> to its processing.</p>
    <ol>
      <li>Send your request to <a href={`mailto:${email}`}>{email}</a> with the subject “ARCO request”.</li>
      <li>Include your name, the email linked to your account, a clear description of the data and the right you wish to exercise and, if applicable, proof of identity.</li>
      <li>We will respond within <strong>20 business days</strong> of receipt.</li>
      <li>If your request is granted, it will take effect within <strong>15 business days</strong> after our response.</li>
    </ol>

    <h2>VI. Withdrawal of consent and limiting use</h2>
    <p>You may withdraw your consent or limit the use or disclosure of your data through the same procedure. Withdrawal is not retroactive.</p>

    <h2>VII. Storage technologies</h2>
    <p>
      XploraSG uses your browser’s local storage (localStorage and IndexedDB) to keep you signed in, store favorites without an account and keep a
      copy of the catalog for offline use. <strong>No advertising or third-party tracking cookies are used.</strong> Sessions end after 15 minutes of inactivity.
    </p>

    <h2>VIII. Security measures</h2>
    <p>We apply administrative, technical and physical safeguards, including encrypted connections (HTTPS/TLS), hashed passwords, role-based access control and row-level security in the database.</p>

    <h2>IX. Minors</h2>
    <p>XploraSG is not directed at people under 18. Minors should create an account only with the consent of a parent or guardian.</p>

    <h2>X. Changes to this notice</h2>
    <p>Any change will be published on this page with its version and last-updated date.</p>

    <h2>XI. Competent authority</h2>
    <p>If you believe your data-protection rights have been violated, you may contact the competent authority, currently Mexico’s Secretaría Anticorrupción y Buen Gobierno.</p>

    <p className="mt-4 text-sm">See also the <Link to="/terminos">Terms and conditions of use</Link>.</p>
  </>
);

const TermsEn = ({ email }: { email: string }) => (
  <>
    <p>
      These Terms and conditions govern access to and use of <strong>XploraSG – Smart Tourism Platform for the Sierra Gorda</strong> (“the
      Platform”), developed by the XploraSG development team (“the Team”). By using the Platform you accept these terms in full.
    </p>

    <h2>1. Definitions</h2>
    <ul>
      <li><strong>User:</strong> anyone who accesses the Platform, with or without an account.</li>
      <li><strong>Business:</strong> a person or company offering tourism services whose information is published on the Platform.</li>
      <li><strong>Content:</strong> texts, listings, photographs, maps, events and other information on the Platform.</li>
      <li><strong>Chatboot:</strong> the Platform’s virtual assistant, which answers based on catalog listings.</li>
    </ul>

    <h2>2. Nature of the service</h2>
    <p>The Platform is a free, <strong>non-profit academic prototype</strong> developed within the Nuevos Talentos Científicos y Tecnológicos 2026 program to promote sustainable tourism in the Sierra Gorda.</p>

    <h2>3. Registration and accounts</h2>
    <p>Registration is optional. Users must provide truthful information and keep their password confidential. Business accounts are granted by the Team after verification. The Team may suspend accounts that breach these terms.</p>

    <h2>4. Permitted use</h2>
    <p>Users must not publish false or offensive information, attempt to breach security, scrape content in bulk or impersonate others.</p>

    <h2>5. Information about places and services</h2>
    <p>Information comes from public sources, fieldwork and the businesses themselves and is reviewed before publication, but it may change without notice. <strong>Always confirm hours, access and conditions before you travel.</strong></p>

    <h2>6. Bookings and businesses</h2>
    <p>Bookings and payments are arranged directly with each business. The Team <strong>charges no fees, processes no payments and is not a party</strong> to those agreements.</p>

    <h2>7. Virtual assistant</h2>
    <p>Chatboot’s answers are generated automatically from verified listings and the weather forecast and are for <strong>guidance only</strong>.</p>

    <h2>8. Safety on your visits</h2>
    <p>Rivers, canyons, waterfalls, sinkholes and mountains involve risks. Users are responsible for their outings and must follow the instructions of local guides and authorities.</p>

    <h2>9. Limitation of liability</h2>
    <p>The Platform is provided “as is” as a prototype under evaluation. The Team does not guarantee uninterrupted availability and is not liable for damages arising from the use of published information or from agreements with businesses.</p>

    <h2>10. Intellectual property</h2>
    <p>The XploraSG name, brand, logo, mascot, original texts and code are the Team’s work. Some catalog photographs come from public sources or from the businesses and remain the property of their authors; they are being replaced with original photos. Rights holders may request removal or credit at <a href={`mailto:${email}`}>{email}</a>.</p>

    <h2>11. Cultural and environmental respect</h2>
    <p>The Franciscan missions are active churches and UNESCO World Heritage Sites; rock art and archaeological zones are protected by law.</p>

    <h2>12. Personal data</h2>
    <p>Personal data is processed as described in the <Link to="/privacidad">Comprehensive privacy notice</Link>.</p>

    <h2>13. Changes</h2>
    <p>The Team may modify these terms at any time; the current version will be published on this page with its date.</p>

    <h2>14. Governing law and jurisdiction</h2>
    <p>These terms are governed by the federal laws of Mexico. The parties submit to the competent courts of the State of Querétaro.</p>

    <h2>15. Contact</h2>
    <p>For questions or reports, write to <a href={`mailto:${email}`}>{email}</a>.</p>
  </>
);
