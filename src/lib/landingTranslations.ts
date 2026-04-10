/**
 * Landing page copy — one memorial product voice, localized.
 */

export type LandingLocale = "en" | "ko" | "ja" | "fr" | "es" | "ar"

export const LANDING_LOCALE_STORAGE_KEY = "aeterna.landing.locale"

export const LANDING_LOCALES: {
  code: LandingLocale
  /** Short label in English (for the menu) */
  label: string
  /** Native name */
  native: string
}[] = [
  { code: "en", label: "English", native: "English" },
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "fr", label: "French", native: "Français" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "ar", label: "Arabic", native: "العربية" },
]

export type LandingStrings = {
  nav: { howItWorks: string; pricing: string; faq: string }
  hero: {
    title1: string
    title2: string
    body: string
    tagline: string
    ctaCreate: string
    ctaMyMemorial: string
    /** Screen-reader / SEO: describes the foreground phone image for this locale’s cultural framing. */
    heroPortraitAlt: string
    /** Secondary phone image (e.g. pets, family scene, quiet memorial mood). */
    heroSecondaryAlt: string
  }
  howItWorks: {
    kicker: string
    title: string
    subtitle: string
    steps: [step: { title: string; description: string }, step: { title: string; description: string }, step: { title: string; description: string }]
  }
  pricing: {
    kicker: string
    title: string
    subtitle: string
    usdNote: string
    comingSoon: string
    plans: [
      { tierName: string; value: string; cta: string },
      { tierName: string; value: string; cta: string },
      { tierName: string; value: string; cta: string; statusTag: string },
    ]
  }
  faq: {
    kicker: string
    title: string
    subtitle: string
    items: { q: string; a: string }[]
  }
  footer: string
}

const EN: LandingStrings = {
  nav: { howItWorks: "How it works", pricing: "Pricing", faq: "FAQ" },
  hero: {
    title1: "A Digital Shrine for",
    title2: "Sacred Memory",
    body: "A lasting space for people and pets, preserved with dignity. Share instantly by QR or link: no app, no friction; guests add photos and stories from any phone. A gentle memorial feed where visitors heart and comment on each memory, like a sacred timeline of their legacy.",
    tagline: "Footprints, remembrance, and preservation in one hallowed place.",
    ctaCreate: "Create a Memorial Now",
    ctaMyMemorial: "My memorial",
    heroPortraitAlt:
      "Portrait of a dignified elder on a memorial page — meant to evoke your own grandparents and family.",
    heroSecondaryAlt: "Pets and companions as part of the family story.",
  },
  howItWorks: {
    kicker: "How it works",
    title: "Create · Share · Gather",
    subtitle:
      "Three pillars: a digital shrine for humans and pets; zero-friction access by QR or link with no app; and a community memorial where visitors heart and comment, so the moments that matter stay in view.",
    steps: [
      {
        title: "Create a Digital Shrine",
        description:
          "Build a dignified memorial space for your loved one or pet in seconds.",
      },
      {
        title: "Scan · Share",
        description:
          "Place a QR code at the service or share a link. Guests upload photos and stories instantly. No app required.",
      },
      {
        title: "Connect · Relive",
        description:
          "The community hearts their favorite memories, and the most-loved stories rise to the top.",
      },
    ],
  },
  pricing: {
    kicker: "Pricing",
    title: "Sacred preservation. One-time.",
    subtitle:
      "The first 7 days are a free window to gather memories. Upgrade anytime to preserve the shrine forever.",
    usdNote: "All prices in US dollars (USD).",
    comingSoon: "Coming Soon",
    plans: [
      {
        tierName: "Sacred Window",
        value: "7 days to gather memories. A gentle, peaceful start.",
        cta: "Start",
      },
      {
        tierName: "Eternal Legacy",
        value: "Keep every photo and story preserved forever. No expiration.",
        cta: "Select",
      },
      {
        tierName: "The Eternal Film",
        value: "Everything in Legacy, plus priority access to your 1-minute AI tribute film.",
        cta: "Select",
        statusTag: "Coming Soon",
      },
    ],
  },
  faq: {
    kicker: "FAQ",
    title: "Questions, gently answered",
    subtitle: "Artisan care for families across the US, Australia, and beyond.",
    items: [
      {
        q: "What is Aeterna?",
        a: "Aeterna is a digital treasure box for the memories of those we love: both people and pets. It's a special place where their smiles, voices, and stories live forever, instead of being lost in a phone gallery or a dusty album.",
      },
      {
        q: "Why did you start this?",
        a: 'Our founder started Aeterna after losing his father. He realized there was no beautiful, shared space to celebrate a life with others digitally. He created Aeterna to make sure no one has to feel alone in their remembrance, turning a "shrine" into a living celebration of love.',
      },
      {
        q: "How do I start a memorial?",
        a: "It's as simple as planting a seed. First, you create a profile for your loved one. Second, you share a link or a QR code with family and friends. There's no app to download and no complicated login, just a direct path to sharing love.",
      },
      {
        q: "How do friends and family help?",
        a: 'Once they receive the link, they can instantly upload photos, leave "likes," or share a heartwarming comment. It\'s like a group hug where everyone brings their favorite memory to help the story grow.',
      },
      {
        q: "Can I use this for a physical service?",
        a: "Yes. You can create a beautiful PDF invitation with a unique QR code. Print it and place it at a memorial service or send it digitally. Visitors can simply scan it with their phones to contribute their photos and messages in real-time.",
      },
      {
        q: "Is it safe and private?",
        a: "Absolutely. Like a secret garden, only the people you invite can enter. Your memories aren't products for the public; they are sacred treasures kept safe and private for those who truly knew the deceased.",
      },
      {
        q: "What happens in the long run?",
        a: "We believe memories should move and speak. In the future, we will help you turn the most-loved photos into a beautiful AI tribute film: a living movie of a life well-lived, so the story stays vibrant for generations to come.",
      },
    ],
  },
  footer: "For celebration-of-life professionals & care providers · hoon@aya.yale.edu",
}

const KO: LandingStrings = {
  nav: { howItWorks: "이용 방법", pricing: "요금", faq: "자주 묻는 질문" },
  hero: {
    title1: "가족의 기억을 품은",
    title2: "디지털 기념 공간",
    body: "지나간 날을 정갈하게 모시고, 남은 가족이 함께 이어 가는 곳입니다. QR이나 링크로 친지가 모이고, 앱 없이 사진과 이야기를 남깁니다. 과한 슬픔보다 평온한 안식과 ‘가족의 끈’을 담은 한 타임라인입니다.",
    tagline: "그리움은 남기고, 온기는 이어집니다.",
    ctaCreate: "지금 기념관 만들기",
    ctaMyMemorial: "내 기념관",
    heroPortraitAlt:
      "인자하게 웃고 계신 한국인 할머니의 초상. 따뜻한 니트나 한복 소재를 떠올리는 포근한 분위기입니다.",
    heroSecondaryAlt:
      "가족과 함께하는 시간을 담은 장면을 상징합니다. 반려동물과의 일상도 소중한 가족의 기억으로 남깁니다.",
  },
  howItWorks: {
    kicker: "이용 방법",
    title: "만들기 · 나누기 · 모으기",
    subtitle:
      "세 가지 축: 사람과 반려동물을 위한 디지털 기념관, QR·링크로 앱 없이 접속, 방문객이 하트와 댓글로 남기는 공동 추모.",
    steps: [
      {
        title: "디지털 기념관 만들기",
        description: "몇 초 만에 사랑하는 이와 반려동물을 위한 품격 있는 공간을 만듭니다.",
      },
      {
        title: "스캔 · 공유",
        description:
          "장례식장에 QR을 두거나 링크를 보내세요. 방문객이 즉시 사진과 이야기를 올립니다. 앱이 필요 없습니다.",
      },
      {
        title: "연결 · 되새김",
        description:
          "가장 마음에 드는 추억에 하트를 누르고, 사랑받은 이야기가 위로 올라옵니다.",
      },
    ],
  },
  pricing: {
    kicker: "요금",
    title: "소중한 보존. 일회성.",
    subtitle:
      "첫 7일은 추모를 모으는 무료 기간입니다. 언제든지 업그레이드해 영구히 보존하세요.",
    usdNote: "모든 가격은 미국 달러(USD) 기준입니다.",
    comingSoon: "곧 출시",
    plans: [
      {
        tierName: "Sacred Window",
        value: "7일간 추모를 모읍니다. 부드러운 시작.",
        cta: "시작하기",
      },
      {
        tierName: "Eternal Legacy",
        value: "모든 사진과 이야기를 영구 보존합니다. 만료 없음.",
        cta: "선택",
      },
      {
        tierName: "The Eternal Film",
        value: "Legacy의 모든 것 + 1분 AI 추모 영상 우선 이용.",
        cta: "선택",
        statusTag: "곧 출시",
      },
    ],
  },
  faq: {
    kicker: "자주 묻는 질문",
    title: "부드럽게 답합니다",
    subtitle: "정갈하고 따뜻한 마음으로, 가족 중심의 추모를 돕습니다.",
    items: [
      {
        q: "Aeterna란 무엇인가요?",
        a: "Aeterna는 사랑하는 이들의 기억을 담는 디지털 보석함입니다. 사람과 반려동물 모두를 위한 공간으로, 사진첩 속에 묻히지 않고 미소와 목소리, 이야기가 오래 남도록 합니다.",
      },
      {
        q: "왜 만드셨나요?",
        a: "창업자가 아버지를 잃은 뒤, 함께 삶을 기념할 아름다운 디지털 공간이 부족함을 느꼈습니다. 추모가 사랑의 축제가 되도록 Aeterna를 만들었습니다.",
      },
      {
        q: "기념관은 어떻게 시작하나요?",
        a: "씨앗을 심듯 간단합니다. 먼저 사랑하는 이의 프로필을 만들고, 가족과 친지에게 링크나 QR 코드를 공유하세요. 앱 설치나 복잡한 로그인 없이 사랑을 나눌 수 있습니다.",
      },
      {
        q: "친구와 가족은 어떻게 참여하나요?",
        a: "링크를 받으면 바로 사진을 올리고, 좋아요와 따뜻한 댓글을 남길 수 있습니다. 모두가 자신의 추억을 가져와 이야기를 키워가는 것과 같습니다.",
      },
      {
        q: "실제 추모 행사에 쓸 수 있나요?",
        a: "네. 고유 QR 코드가 있는 아름다운 PDF 초대장을 만들 수 있습니다. 행사장에 인쇄해 두거나 디지털로 보내세요. 방문객이 휴대폰으로 스캔해 실시간으로 사진과 메시지를 남길 수 있습니다.",
      },
      {
        q: "안전하고 비공개인가요?",
        a: "그렇습니다. 초대한 사람만 들어올 수 있는 비밀의 정원과 같습니다. 추억은 상품이 아니라, 고인을 진심으로 알았던 이들만을 위한 소중한 보물입니다.",
      },
      {
        q: "앞으로는 어떻게 되나요?",
        a: "기억은 움직이고 말해야 한다고 믿습니다. 앞으로 가장 사랑받은 사진들을 아름다운 AI 추모 영상으로 엮어, 세대를 넘어 이야기가 살아 있도록 돕겠습니다.",
      },
    ],
  },
  footer: "라이프 셀레브레이션 전문가 및 케어 제공자용 · hoon@aya.yale.edu",
}

const JA: LandingStrings = {
  nav: { howItWorks: "使い方", pricing: "料金", faq: "よくある質問" },
  hero: {
    title1: "静かに祈る、",
    title2: "個人の追悼の場所",
    body: "礼儀と余白を大切にした、極めてシンプルなデジタル空間です。QRやリンクで家族が静かに集まり、アプリ不要で写真と言の葉を綴れます。お盆のように灯りを分かち合うように、思い出はそっと並びます。",
    tagline: "不完全さのなかにある美しさを、そっと残す。",
    ctaCreate: "いつでも追悼ページを作る",
    ctaMyMemorial: "マイ追悼",
    heroPortraitAlt:
      "畳や庭園を思わせる落ち着いた光の中の、品のあるご高齢の方のポートレート。",
    heroSecondaryAlt:
      "静かな追悼の空気を連想させる一コマ。家族の記憶を重ねるイメージです。",
  },
  howItWorks: {
    kicker: "使い方",
    title: "作成 · 共有 · 集める",
    subtitle:
      "ミニマルな三本柱：デジタルな祈りの場、QRやリンクでアプリ不要、訪問者がそっと心を残すコミュニティ追悼。",
    steps: [
      {
        title: "デジタルな祈りの場を作る",
        description: "数秒で、愛する人やペットのための品格ある空間を用意できます。",
      },
      {
        title: "スキャン · 共有",
        description:
          "式場にQRを置くかリンクを送ります。ゲストはすぐに写真とエピソードを投稿。アプリは不要です。",
      },
      {
        title: "つながる · 蘇る",
        description:
          "コミュニティが心に響く思い出にハートを押し、愛されたストーリーが上へ。",
      },
    ],
  },
  pricing: {
    kicker: "料金",
    title: "尊い保存。一度きりのお支払い。",
    subtitle:
      "最初の7日間は思い出を集める無料の窓です。いつでもアップグレードして永遠に保存できます。",
    usdNote: "表示価格は米ドル（USD）です。",
    comingSoon: "近日公開",
    plans: [
      {
        tierName: "Sacred Window",
        value: "7日間で思い出を集めます。穏やかな始まり。",
        cta: "始める",
      },
      {
        tierName: "Eternal Legacy",
        value: "写真とストーリーを永久保存。期限なし。",
        cta: "選ぶ",
      },
      {
        tierName: "The Eternal Film",
        value: "レガシーのすべてに加え、1分のAI追悼映像を優先的に。",
        cta: "選ぶ",
        statusTag: "近日公開",
      },
    ],
  },
  faq: {
    kicker: "よくある質問",
    title: "丁寧にお答えします",
    subtitle: "米国、オーストラリアなど、世界中のご家族への丁寧なケア。",
    items: [
      {
        q: "Aeternaとは？",
        a: "Aeternaは、愛する人の記憶をしまうデジタルの宝箱です。人もペットも、笑顔や声、物語がアルバムの奥ではなく、ここに永く残る場所です。",
      },
      {
        q: "なぜ作ったのですか？",
        a: "創業者が父を亡くした後、共に人生を祝う美しいデジタル空間がないと感じました。追悼が愛の祝祭になるようにAeternaを作りました。",
      },
      {
        q: "追悼ページはどう始めますか？",
        a: "種をまくように簡単です。まず愛する人のプロフィールを作り、家族や友人にリンクまたはQRコードを共有します。アプリのダウンロードや複雑なログインは不要です。",
      },
      {
        q: "友人や家族はどう参加しますか？",
        a: "リンクを受け取れば、すぐに写真をアップし、「いいね」や温かいコメントを残せます。みんなが思い出を持ち寄って物語を育てるようなものです。",
      },
      {
        q: "対面の式にも使えますか？",
        a: "はい。固有のQRコード付きの美しいPDF招待状を作れます。印刷して式場に置くか、デジタルで送ってください。ゲストはスマホでスキャンし、リアルタイムで写真やメッセージを残せます。",
      },
      {
        q: "安全でプライベートですか？",
        a: "はい。あなたが招いた人だけが入れる秘密の庭のようなものです。思い出は商品ではなく、亡くなった方を本当に知っていた人だけのための宝物です。",
      },
      {
        q: "将来はどうなりますか？",
        a: "記憶は動き、語るべきだと信じています。これから、最も愛された写真を美しいAI追悼映画にし、世代を超えて物語が輝き続けるようにします。",
      },
    ],
  },
  footer: "Celebration of life のプロフェッショナル・ケア提供者向け · hoon@aya.yale.edu",
}

const FR: LandingStrings = {
  nav: { howItWorks: "Fonctionnement", pricing: "Tarifs", faq: "FAQ" },
  hero: {
    title1: "Un sanctuaire numérique pour",
    title2: "une mémoire sacrée",
    body: "Un lieu durable pour les êtres chers et les compagnons, préservé avec dignité. Partagez par QR ou lien : pas d’application ; les proches ajoutent photos et récits depuis leur téléphone. Un fil mémorial doux où l’on cœur et commente chaque souvenir.",
    tagline: "Traces, souvenir et préservation en un seul lieu.",
    ctaCreate: "Créer un mémorial",
    ctaMyMemorial: "Mon mémorial",
    heroPortraitAlt:
      "Portrait d’un aîné sur une page commémorative — pour évoquer vos propres parents et grands-parents.",
    heroSecondaryAlt: "Compagnons à quatre pattes et animaux de famille au cœur du récit.",
  },
  howItWorks: {
    kicker: "Fonctionnement",
    title: "Créer · Partager · Rassembler",
    subtitle:
      "Trois piliers : un sanctuaire numérique pour humains et animaux ; accès sans friction par QR ou lien, sans application ; mémorial communautaire avec cœurs et commentaires.",
    steps: [
      {
        title: "Créer un sanctuaire numérique",
        description:
          "Créez en quelques secondes un espace digne pour votre proche ou votre animal.",
      },
      {
        title: "Scanner · Partager",
        description:
          "Posez un QR à la cérémonie ou envoyez un lien. Les invités publient photos et textes tout de suite. Aucune application requise.",
      },
      {
        title: "Relier · Revivre",
        description:
          "La communauté cœur les souvenirs préférés, et les plus aimés remontent.",
      },
    ],
  },
  pricing: {
    kicker: "Tarifs",
    title: "Préservation sacrée. Paiement unique.",
    subtitle:
      "Les 7 premiers jours sont une fenêtre gratuite pour recueillir les souvenirs. Passez à un plan supérieur quand vous voulez pour préserver le sanctuaire pour toujours.",
    usdNote: "Tous les prix sont en dollars US (USD).",
    comingSoon: "Bientôt",
    plans: [
      {
        tierName: "Sacred Window",
        value: "7 jours pour rassembler les souvenirs. Un début doux.",
        cta: "Commencer",
      },
      {
        tierName: "Eternal Legacy",
        value: "Chaque photo et récit conservés pour toujours. Sans expiration.",
        cta: "Choisir",
      },
      {
        tierName: "The Eternal Film",
        value: "Tout Legacy, plus un accès prioritaire à votre film hommage IA d’une minute.",
        cta: "Choisir",
        statusTag: "Bientôt",
      },
    ],
  },
  faq: {
    kicker: "FAQ",
    title: "Des réponses, avec douceur",
    subtitle: "Un soin artisanal pour les familles aux États-Unis, en Australie et au-delà.",
    items: [
      {
        q: "Qu’est-ce qu’Aeterna ?",
        a: "Aeterna est un coffret numérique pour les souvenirs de ceux que nous aimons, humains et animaux. Un lieu où sourires, voix et histoires demeurent, au lieu de se perdre dans une galerie ou un album poussiéreux.",
      },
      {
        q: "Pourquoi ce projet ?",
        a: "Notre fondateur a lancé Aeterna après la perte de son père. Il manquait d’un bel espace partagé pour célébrer une vie en ligne. Aeterna veut que personne ne soit seul dans le deuil, et qu’un sanctuaire devienne une célébration vivante de l’amour.",
      },
      {
        q: "Comment commencer un mémorial ?",
        a: "Comme planter une graine : créez d’abord un profil, puis partagez un lien ou un QR avec la famille et les amis. Pas d’application à télécharger ni de connexion compliquée.",
      },
      {
        q: "Comment la famille et les amis participent-ils ?",
        a: "Avec le lien, ils peuvent publier des photos, des « j’aime » ou un commentaire chaleureux. Comme une étreinte collective où chacun apporte sa mémoire préférée.",
      },
      {
        q: "Puis-je l’utiliser pour une cérémonie en présentiel ?",
        a: "Oui. Créez une invitation PDF avec un QR unique. Imprimez-la pour la cérémonie ou envoyez-la par message. Les invités scannent avec leur téléphone et contribuent en direct.",
      },
      {
        q: "Est-ce sûr et privé ?",
        a: "Absolument. Comme un jardin secret : seules les personnes invitées entrent. Vos souvenirs ne sont pas une marchandise publique ; ce sont des trésors pour ceux qui ont vraiment connu la personne.",
      },
      {
        q: "Et à long terme ?",
        a: "Nous croyons que les souvenirs doivent bouger et parler. À l’avenir, nous transformerons les photos les plus aimées en un beau film hommage IA : un film vivant d’une vie, pour les générations futures.",
      },
    ],
  },
  footer: "Pour les professionnels de célébration de vie et les soignants · hoon@aya.yale.edu",
}

const ES: LandingStrings = {
  nav: { howItWorks: "Cómo funciona", pricing: "Precios", faq: "Preguntas" },
  hero: {
    title1: "Un santuario digital para",
    title2: "la memoria sagrada",
    body: "Un espacio duradero para personas y mascotas, preservado con dignidad. Comparte por QR o enlace: sin app; familiares y amigos añaden fotos e historias desde el móvil. Un feed conmovedor donde se puede dar corazón y comentar cada recuerdo.",
    tagline: "Huellas, recuerdo y preservación en un solo lugar.",
    ctaCreate: "Crear un memorial ahora",
    ctaMyMemorial: "Mi memorial",
    heroPortraitAlt:
      "Retrato de una persona mayor en una página conmemorativa — evoca a tus propios familiares.",
    heroSecondaryAlt: "Mascotas y compañeros como parte de la historia familiar.",
  },
  howItWorks: {
    kicker: "Cómo funciona",
    title: "Crear · Compartir · Reunir",
    subtitle:
      "Tres pilares: un santuario digital para personas y mascotas; acceso sin fricción por QR o enlace, sin app; y un memorial comunitario con corazones y comentarios.",
    steps: [
      {
        title: "Crea un santuario digital",
        description:
          "En segundos, un espacio digno para tu ser querido o mascota.",
      },
      {
        title: "Escanear · Compartir",
        description:
          "Coloca un QR en el servicio o comparte un enlace. Los invitados suben fotos e historias al instante. No se necesita app.",
      },
      {
        title: "Conectar · Revivir",
        description:
          "La comunidad da corazón a los recuerdos favoritos y los más queridos suben.",
      },
    ],
  },
  pricing: {
    kicker: "Precios",
    title: "Preservación sagrada. Pago único.",
    subtitle:
      "Los primeros 7 días son una ventana gratuita para reunir recuerdos. Mejora cuando quieras para conservar el santuario para siempre.",
    usdNote: "Todos los precios están en dólares estadounidenses (USD).",
    comingSoon: "Próximamente",
    plans: [
      {
        tierName: "Sacred Window",
        value: "7 días para reunir recuerdos. Un comienzo sereno.",
        cta: "Empezar",
      },
      {
        tierName: "Eternal Legacy",
        value: "Cada foto e historia conservada para siempre. Sin caducidad.",
        cta: "Elegir",
      },
      {
        tierName: "The Eternal Film",
        value: "Todo Legacy, más acceso prioritario a tu película homenaje con IA de 1 minuto.",
        cta: "Elegir",
        statusTag: "Próximamente",
      },
    ],
  },
  faq: {
    kicker: "Preguntas",
    title: "Respuestas, con calma",
    subtitle: "Cuidado artesanal para familias en EE. UU., Australia y más allá.",
    items: [
      {
        q: "¿Qué es Aeterna?",
        a: "Aeterna es un cofre digital para los recuerdos de quienes amamos: personas y mascotas. Un lugar donde sus sonrisas, voces e historias permanecen, en lugar de perderse en la galería del teléfono o en un álbum polvoriento.",
      },
      {
        q: "¿Por qué lo crearon?",
        a: "Nuestro fundador lanzó Aeterna tras perder a su padre. No había un espacio compartido y hermoso para celebrar una vida en línea. Aeterna existe para que nadie esté solo en el duelo, convirtiendo un «santuario» en una celebración viva del amor.",
      },
      {
        q: "¿Cómo empiezo un memorial?",
        a: "Tan simple como plantar una semilla: primero creas un perfil para tu ser querido; luego compartes un enlace o un código QR con familia y amigos. No hay app que descargar ni inicio de sesión complicado.",
      },
      {
        q: "¿Cómo ayudan amigos y familia?",
        a: "Con el enlace pueden subir fotos al instante, dar «me gusta» o dejar un comentario cálido. Es como un abrazo grupal donde cada uno aporta su recuerdo favorito.",
      },
      {
        q: "¿Puedo usarlo en un servicio presencial?",
        a: "Sí. Puedes crear una invitación PDF hermosa con un QR único. Imprímela en el servicio o envíala por mensaje. Los visitantes escanean con el móvil y contribuyen fotos y mensajes en tiempo real.",
      },
      {
        q: "¿Es seguro y privado?",
        a: "Por supuesto. Como un jardín secreto: solo entran quienes invitas. Tus recuerdos no son mercancía pública; son tesoros sagrados para quienes realmente conocieron a la persona.",
      },
      {
        q: "¿Qué pasa a largo plazo?",
        a: "Creemos que los recuerdos deben moverse y hablar. En el futuro ayudaremos a convertir las fotos más queridas en una hermosa película homenaje con IA: una película viva de una vida bien vivida, para las generaciones venideras.",
      },
    ],
  },
  footer: "Para profesionales de celebración de vida y cuidadores · hoon@aya.yale.edu",
}

const AR: LandingStrings = {
  nav: { howItWorks: "كيف يعمل", pricing: "الأسعار", faq: "الأسئلة الشائعة" },
  hero: {
    title1: "ضريح رقمي لـ",
    title2: "ذاكرة تليق بالعائلة",
    body: "مساحة دائمة بوقار للبشر وللحيوانات الأليفة. شارِك فورًا عبر الرمز أو الرابط دون تطبيق؛ تجتمع العائلة الكبيرة — أبناء وبنات وأحفاد — فيرفعون الصور والقصص من أي هاتف. تغذية تذكارية هادئة: إعجاب وتعليق باحترام عميق، لا مبالغة في إظهار الحزن بل اعتراف بالجميل الذي كان.",
    tagline: "بين سواد الليل والذهب: ذكرى تُجَلّل الماضي وتربط الأجيال.",
    ctaCreate: "أنشئ نصبًا تذكاريًا الآن",
    ctaMyMemorial: "نصبي التذكاري",
    heroPortraitAlt:
      "صورة لمسنّ أو مسنّة بابتسامة حانية، يُقصد بها إثارة صورة الجدّ أو الجدّة في العائلة العربية، بلباسٍ تقليدي أو هادئ يليق بالاحترام.",
    heroSecondaryAlt:
      "مشهد يجمع الحيوانات الأليفة أو لحظة عائلية دافئة، كرمز للألفة داخل البيت الكبير.",
  },
  howItWorks: {
    kicker: "كيف يعمل",
    title: "أنشئ · شارِك · اجمع",
    subtitle:
      "ثلاث ركائز: ضريح رقمي للبشر وللحيوانات؛ وصول سلس عبر الرمز أو الرابط دون تطبيق؛ ونصب تذكاري جماعي حيث يضع الزوار القلب والتعليقات.",
    steps: [
      {
        title: "أنشئ ضريحًا رقميًا",
        description: "ابنِ في ثوانٍ مكانًا لائقًا لمن تحب أو لرفيقك الأليف.",
      },
      {
        title: "امسح · شارِك",
        description:
          "ضع رمزًا في الخدمة أو أرسل رابطًا. يحمّل الضيوف الصور والقصص فورًا. لا حاجة لتطبيق.",
      },
      {
        title: "تواصل · أعد العيش",
        description:
          "المجتمع يضع القلب على الذكريات المفضلة، وتصعد الأكثر حبًا.",
      },
    ],
  },
  pricing: {
    kicker: "الأسعار",
    title: "حفظ مقدّس. دفعة واحدة.",
    subtitle:
      "الأيام السبعة الأولى نافذة مجانية لجمع الذكريات. ترقَّ في أي وقت للحفظ للأبد.",
    usdNote: "جميع الأسعار بالدولار الأمريكي (USD).",
    comingSoon: "قريبًا",
    plans: [
      {
        tierName: "Sacred Window",
        value: "7 أيام لجمع الذكريات. بداية لطيفة.",
        cta: "ابدأ",
      },
      {
        tierName: "Eternal Legacy",
        value: "احتفظ بكل صورة وقصة للأبد. دون انتهاء.",
        cta: "اختر",
      },
      {
        tierName: "The Eternal Film",
        value: "كل ما في Legacy، بالإضافة إلى أولوية لفيلم تكريم بالذكاء الاصطناعي لمدة دقيقة.",
        cta: "اختر",
        statusTag: "قريبًا",
      },
    ],
  },
  faq: {
    kicker: "الأسئلة الشائعة",
    title: "إجابات برفق",
    subtitle: "عناية محترمة للعائلات الكبيرة — في الولايات المتحدة والعالم العربي وما بعدهما.",
    items: [
      {
        q: "ما هو Aeterna؟",
        a: "Aeterna صندوق رقمي لذكريات من نحب: البشر والحيوانات الأليفة. مكان خاص تبقى فيه الابتسامات والأصوات والقصص، بدلًا من أن تضيع في ألبوم الهاتف أو صندوق غبار.",
      },
      {
        q: "لماذا بدأتم هذا؟",
        a: "بدأ مؤسسنا Aeterna بعد فقدان والده. أدرك أنه لا يوجد فضاء جميل ومشترك للاحتفال بحياة رقميًا. صُمم Aeterna لكيلا يشعر أحد وحيدًا في ذكراه، محولًا «الضريح» إلى احتفال حي بالحب.",
      },
      {
        q: "كيف أبدأ نصبًا تذكاريًا؟",
        a: "ببساطة كزرع بذرة: أنشئ أولًا ملفًا لمن تحب، ثم شارِك رابطًا أو رمز استجابة سريعة مع العائلة والأصدقاء. لا تطبيق للتحميل ولا تسجيل معقد.",
      },
      {
        q: "كيف يساعد الأصدقاء والعائلة؟",
        a: "بمجرد استلام الرابط يمكنهم رفع الصور فورًا، أو الإعجاب، أو ترك تعليق دافئ. كعناق جماعي يحضر فيه الجميع ذكراهم المفضلة.",
      },
      {
        q: "هل يمكن استخدامه في خدمة فعلية؟",
        a: "نعم. يمكنك إنشاء دعوة PDF جميلة برمز استجابة سريعة فريد. اطبعها في الخدمة أو أرسلها رقميًا. يمسح الزوار بالهاتف ويساهمون بالصور والرسائل في الوقت الفعلي.",
      },
      {
        q: "هل هو آمن وخاص؟",
        a: "بالتأكيد. كحديقة سرية: فقط من تدعوهم يدخلون. ذكرياتك ليست سلعة للعامة؛ إنها كنوز مقدسة لمن عرف المتوفى حقًا.",
      },
      {
        q: "ماذا على المدى الطويل؟",
        a: "نؤمن أن الذكريات يجب أن تتحرك وتتكلم. في المستقبل سنساعدك على تحويل أكثر الصور حبًا إلى فيلم تكريم بالذكاء الاصطناعي: فيلم حي لحياة عاشت بشكل جيد، لتبقى القصة حية للأجيال.",
      },
    ],
  },
  footer: "للمهنيين في احتفالات الحياة ومقدمي الرعاية · hoon@aya.yale.edu",
}

export const LANDING_COPY: Record<LandingLocale, LandingStrings> = {
  en: EN,
  ko: KO,
  ja: JA,
  fr: FR,
  es: ES,
  ar: AR,
}

export function isLandingLocale(x: string | null | undefined): x is LandingLocale {
  return x === "en" || x === "ko" || x === "ja" || x === "fr" || x === "es" || x === "ar"
}

export function getLandingStrings(locale: LandingLocale): LandingStrings {
  return LANDING_COPY[locale] ?? EN
}
