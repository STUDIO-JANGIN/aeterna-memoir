/**
 * Landing page copy — one memorial product voice, localized.
 */

export type LandingLocale = "en" | "ko" | "ja" | "fr" | "es" | "ar" | "zh" | "zh-hk"

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
  { code: "zh", label: "Chinese (Traditional, Taiwan)", native: "繁體中文（台灣）" },
  { code: "zh-hk", label: "Chinese (Traditional, Hong Kong)", native: "繁體中文（香港）" },
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
    /** Small note above optional currency selector (region / language + manual override). */
    currencyDisclaimer: string
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
    currencyDisclaimer:
      "Currency is based on your region (first visit) or your selected language. Change it here before checkout.",
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
        value:
          "Everything in Legacy, plus five AI tribute clips (~10s each) — moving photographs that bring you close to them again.",
        cta: "Select",
        statusTag: "Coming Soon",
      },
    ],
  },
  faq: {
    kicker: "FAQ",
    title: "Questions, gently answered",
    subtitle: "Artisan care for families across the globe.",
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
        a: "We believe memories should move and speak. Premium helps you turn the most-loved photos into five warm AI tribute clips (~10s each)—moving photographs of a life well-lived—so the story stays vibrant for generations to come.",
      },
    ],
  },
  footer: "For celebration-of-life professionals & care providers · hoon@aya.yale.edu",
}

const KO: LandingStrings = {
  nav: { howItWorks: "이용 안내", pricing: "요금", faq: "자주 묻는 질문" },
  hero: {
    title1: "영원한 기억을 위한",
    title2: "디지털 추모관",
    body: "사랑하는 가족과 반려동물을 위해, 시간이 흘러도 변치 않을 품격 있는 안식처를 마련하세요. 앱 설치의 번거로움 없이 QR 코드와 링크만으로 소중한 이들과 사진과 이야기를 나눌 수 있습니다. 방문자들이 추억에 공감하고 마음을 더하는 이 공간은, 고인의 삶을 기리는 가장 따뜻하고 성스러운 타임라인이 됩니다.",
    tagline: "발자취, 추모, 그리고 보존이 어우러진 단 하나의 성소.",
    ctaCreate: "지금 추모 공간 만들기",
    ctaMyMemorial: "나의 추모 공간",
    heroPortraitAlt:
      "따뜻하게 미소 지으며 정면을 바라보시는 동아시아 할머니의 초상.",
    heroSecondaryAlt:
      "집에서 함께한 반려견과 반려묘 — 가족 이야기의 한 부분으로 남는 장면.",
  },
  howItWorks: {
    kicker: "이용 안내",
    title: "기록하고 · 나누며 · 함께 기리다",
    subtitle:
      "세 가지 핵심 가치: 사람과 반려동물을 위한 디지털 추모관; 앱 없이 QR과 링크로 접속하는 간편함; 방문자들이 마음을 더해 소중한 순간들을 상단에 머물게 하는 커뮤니티 추모 시스템.",
    steps: [
      {
        title: "디지털 추모관 만들기",
        description: "소중한 사람 혹은 반려동물을 위한 품격 있는 추모 공간을 단 몇 초 만에 완성합니다.",
      },
      {
        title: "스캔하고 공유하기",
        description:
          "추모식 현장에 QR 코드를 비치하거나 링크를 보내세요. 앱 설치 없이 누구나 즉시 사진과 이야기를 남길 수 있습니다.",
      },
      {
        title: "추억으로 연결되다",
        description:
          "커뮤니티가 소중한 기억에 마음(Heart)을 더하면, 가장 많은 사랑을 받은 이야기들이 상단에 노출되어 생생하게 살아납니다.",
      },
    ],
  },
  pricing: {
    kicker: "요금",
    title: "숭고한 보존. 단 한 번의 예우로.",
    subtitle:
      "첫 7일은 추억을 모으기 위한 무료 기간입니다. 언제든 평생 소장 모델로 전환하여 추모관을 영원히 보존하세요.",
    currencyDisclaimer:
      "첫 방문 시에는 지역에 따라, 이후에는 선택하신 언어에 맞춰 표시 통화가 결정됩니다. 결제 전에 아래에서 변경할 수 있습니다.",
    comingSoon: "곧 출시",
    plans: [
      {
        tierName: "기억의 창",
        value: "추억을 모으기 위한 7일간의 여정. 평온하고 부드러운 시작.",
        cta: "시작하기",
      },
      {
        tierName: "영원한 유산",
        value: "모든 사진과 기록을 유효기간 없이 영구히 보존합니다.",
        cta: "선택",
      },
      {
        tierName: "영원한 필름",
        value:
          "Legacy의 모든 혜택과 더불어, AI 추모 클립 5개(각 약 10초) 우선 이용 — 살아 움직이는 사진처럼 다시 만나는 느낌을 선사합니다.",
        cta: "선택",
        statusTag: "곧 출시",
      },
    ],
  },
  faq: {
    kicker: "자주 묻는 질문",
    title: "질문에 정중히 답합니다",
    subtitle: "전 세계 모든 가족을 위한 장인의 정성 어린 손길.",
    items: [
      {
        q: "Aeterna는 무엇인가요?",
        a: "Aeterna는 사랑하는 사람과 반려동물의 기억을 담는 디지털 보물상자입니다. 휴대폰 갤러리나 먼지 쌓인 앨범 속에서 잊혀가는 그들의 미소, 목소리, 그리고 이야기를 영원히 살아 숨 쉬게 하는 특별한 공간입니다.",
      },
      {
        q: "이 서비스를 시작한 이유는 무엇인가요?",
        a: "창업자는 아버지를 떠나보낸 후, 고인의 삶을 함께 기릴 수 있는 품격 있는 디지털 공간이 없다는 것을 깨달았습니다. 누구도 슬픔 속에서 고립되지 않도록, 추모 공간을 사랑의 찬란한 축제로 바꾸기 위해 Aeterna를 만들었습니다.",
      },
      {
        q: "추모 공간은 어떻게 만드나요?",
        a: "씨앗을 심는 것만큼 간단합니다. 먼저 고인의 프로필을 생성하고, 가족 및 지인들과 링크나 QR 코드를 공유하세요. 복잡한 로그인이나 앱 설치 없이, 오직 사랑을 나누는 데만 집중할 수 있습니다.",
      },
      {
        q: "가족과 친구들은 어떻게 참여하나요?",
        a: "링크를 받는 즉시 사진을 올리거나, '마음(Heart)'을 남기고, 따뜻한 댓글을 적을 수 있습니다. 모두가 각자의 기억을 가져와 하나의 큰 이야기를 완성하는 '함께하는 포옹'과 같습니다.",
      },
      {
        q: "오프라인 추모식에서도 사용할 수 있나요?",
        a: "네. 고유 QR 코드가 담긴 아름다운 PDF 초청장을 만들 수 있습니다. 이를 출력해 장례식이나 추모 공간에 비치하세요. 방문객들은 휴대폰으로 스캔하여 실시간으로 사진과 메시지를 남길 수 있습니다.",
      },
      {
        q: "안전하고 프라이빗한가요?",
        a: "물론입니다. 비밀의 정원처럼 당신이 초대한 분들만 입장할 수 있습니다. 여러분의 추억은 광고를 위한 데이터가 아닙니다. 고인을 진심으로 아끼는 이들만을 위해 안전하고 경건하게 보호되는 성스러운 보물입니다.",
      },
      {
        q: "장기적으로는 어떻게 관리되나요?",
        a: "우리는 기억이 정체되지 않고 생동감 있게 전달되어야 한다고 믿습니다. 프리미엄으로 사랑받은 사진을 바탕으로 AI가 약 10초 길이의 추모 클립 다섯 편을 만듭니다(움직이는 사진처럼 따뜻하게). 고인의 이야기가 다음 세대에게도 이어지도록 돕습니다.",
      },
    ],
  },
  footer: "추모 전문 서비스 및 의료/돌봄 제공자 협업 문의 · hoon@aya.yale.edu",
}

const JA: LandingStrings = {
  nav: { howItWorks: "ご利用案内", pricing: "料金・プラン", faq: "よくある質問" },
  hero: {
    title1: "永遠の記憶を刻む、",
    title2: "デジタルの聖所",
    body: "大切な家族やペットのために、歳月が流れても色褪せない品格ある安らぎの場を。アプリのインストールは不要です。QRコードやリンクを通じて、大切な方々と写真や物語を分かち合えます。訪れる方々が共感し、想いを寄せるこの場所は、故人の歩みを称える最も温かく神聖なタイムラインとなります。",
    tagline: "絆、追悼、そして永遠の保存が共鳴する、唯一無二の聖域。",
    ctaCreate: "今すぐ追悼空間を作成する",
    ctaMyMemorial: "マイ・メモリアル",
    heroPortraitAlt:
      "温かく微笑み、こちらをまっすぐ見つめる東アジアのご高齢の女性のポートレート。",
    heroSecondaryAlt:
      "犬や猫など、家族の記憶とともに歩んだペットたち。",
  },
  howItWorks: {
    kicker: "ご利用案内",
    title: "記し · 分かち合い · 共に祈る",
    subtitle:
      "3つの核心的価値：人と言葉を越えた絆のためのデジタル追悼空間。アプリ不要のQR・リンク接続。そして、訪れる人々が想いを重ね、大切な瞬間を鮮やかに保つコミュニティ追悼システム。",
    steps: [
      {
        title: "デジタル追悼空間の作成",
        description: "大切な方やペットのために、品格ある追悼の場をわずか数秒で建立できます。",
      },
      {
        title: "スキャンと共有",
        description:
          "葬儀会場にQRコードを掲示するか、リンクを共有してください。アプリなしで、誰もが即座に写真や物語を綴ることができます。",
      },
      {
        title: "想い出でつながる",
        description:
          "コミュニティが大切な記憶に想いを寄せると、多くの愛を受けた物語が上位に留まり、感動が鮮やかに蘇ります。",
      },
    ],
  },
  pricing: {
    kicker: "料金",
    title: "崇高な保存を、一度限りの真心で。",
    subtitle:
      "最初の7日間は、想い出を集めるための無料期間です。いつでもプランをアップグレードし、この聖所を永久に保存できます。",
    currencyDisclaimer:
      "初回アクセス時は地域に基づき、以降は選択した言語に合わせて表示通貨が決まります。お支払い前に下記で変更できます。",
    comingSoon: "近日公開",
    plans: [
      {
        tierName: "記憶の窓",
        value: "想い出を紡ぎ始めるための7日間。穏やかで優しい始まりの時。",
        cta: "始める",
      },
      {
        tierName: "永遠の遺産",
        value: "すべての写真と物語を、期限なく永久に保存いたします。",
        cta: "選ぶ",
      },
      {
        tierName: "永遠のフィルム",
        value:
          "永遠の遺産の全特典に加え、AIによる追悼クリップ5本（各約10秒）を優先提供 — 動く写真のようにそばにいるような温かさを。",
        cta: "選ぶ",
        statusTag: "近日公開",
      },
    ],
  },
  faq: {
    kicker: "よくある質問",
    title: "丁寧にお答えします",
    subtitle: "世界中のご家族へ、職人の心で寄り添うケアを。",
    items: [
      {
        q: "Aeternaとは何ですか？",
        a: "Aeterna（アエテルナ）は、大切な方やペットとの記憶を収める「デジタルの宝箱」です。スマートフォンのフォルダや埃を被ったアルバムの中で埋もれてしまう笑顔、声、そして物語を、永遠に鮮やかに保つための特別な場所です。",
      },
      {
        q: "なぜこのサービスを始めたのですか？",
        a: "創設者は、父を亡くした際、故人の歩みを品格を持って称え合えるデジタルな場がないことに気づきました。誰もが悲しみの中で孤立することなく、「追悼」を「愛の輝かしい祝祭」へと変えるためにAeternaを設立しました。",
      },
      {
        q: "追悼空間はどうやって作りますか？",
        a: "種をまくのと同じくらい簡単です。まず故人のプロフィールを作成し、家族や知人にリンクやQRコードを共有してください。複雑なログインやアプリのダウンロードは不要で、ただ愛を分かち合うことだけに集中できます。",
      },
      {
        q: "家族や友人はどのように参加できますか？",
        a: "リンクを受け取った瞬間から、写真をアップロードしたり、想いを寄せたり、心温まるコメントを残したりできます。それは、全員がそれぞれの思い出を持ち寄り、一つの大きな物語を完成させる「全員での抱擁」のようなものです。",
      },
      {
        q: "物理的な葬儀でも利用できますか？",
        a: "はい。独自のQRコードが記載された美しい案内状（PDF）を作成できます。これを印刷して式場や祭壇に供えてください。参列者様はご自身のスマートフォンでスキャンするだけで、リアルタイムに写真やメッセージを寄せることができます。",
      },
      {
        q: "安全性とプライバシーは？",
        a: "もちろんです。秘密の花園のように、あなたが招待した方々だけが入場できます。皆様の想い出は広告データではありません。故人を心から慈しむ方々のために、安全かつ神聖に守られる宝物です。",
      },
      {
        q: "長期的な管理はどうなりますか？",
        a: "私たちは、記憶は停滞せず、生き生きと伝えられるべきだと信じています。プレミアムでは、大切な写真をもとにそれぞれ約10秒の追悼クリップを5本お届けします（動く写真のように、そばにいるような温かさを）。故人の物語が次の世代にも鮮やかに伝わるようお手伝いします。",
      },
    ],
  },
  footer: "追悼専門サービスおよび医療・ケア提供者の提携に関するお問い合わせ · hoon@aya.yale.edu",
}

const FR: LandingStrings = {
  nav: { howItWorks: "Fonctionnement", pricing: "Tarifs", faq: "FAQ" },
  hero: {
    title1: "Un sanctuaire numérique pour",
    title2: "la mémoire sacrée",
    body:
      "Un espace pérenne pour les êtres chers et les compagnons de vie, préservé avec dignité. Partagez instantanément via un QR code ou un lien : sans application, sans contrainte. Les proches ajoutent photos et souvenirs depuis n'importe quel téléphone. Un fil commémoratif apaisant où chaque souvenir reçoit un hommage, telle une ligne du temps sacrée de leur héritage.",
    tagline: "Empreintes, recueillement et éternité en un seul lieu sacré.",
    ctaCreate: "Créer un sanctuaire",
    ctaMyMemorial: "Mon espace",
    heroPortraitAlt:
      "Portrait d’un aîné sur une page commémorative — pour évoquer vos propres parents et grands-parents.",
    heroSecondaryAlt: "Compagnons à quatre pattes et animaux de famille au cœur du récit.",
  },
  howItWorks: {
    kicker: "Fonctionnement",
    title: "Créer · Partager · Recueillir",
    subtitle:
      "Trois piliers : un sanctuaire numérique pour humains et animaux ; un accès fluide par QR ou lien sans application ; et un mémorial communautaire où les cœurs et les commentaires font vivre les moments les plus précieux.",
    steps: [
      {
        title: "Créer un sanctuaire numérique",
        description:
          "Bâtissez en quelques secondes un espace de mémoire digne pour votre proche ou votre fidèle compagnon.",
      },
      {
        title: "Scanner et partager",
        description:
          "Disposez un QR code lors de la cérémonie ou partagez un lien. Les proches publient photos et récits instantanément. Aucune application requise.",
      },
      {
        title: "Relier et revivre",
        description:
          "La communauté rend hommage aux souvenirs, et les récits les plus chers s'élèvent naturellement en tête de page.",
      },
    ],
  },
  pricing: {
    kicker: "Tarifs",
    title: "Préservation sacrée. Un hommage unique.",
    subtitle:
      "Les 7 premiers jours sont une fenêtre gratuite pour rassembler les souvenirs. Passez à la préservation éternelle à tout moment.",
    currencyDisclaimer:
      "La devise affichée dépend de votre région lors de la première visite ou de la langue sélectionnée ; vous pouvez la modifier ci-dessous avant le paiement (y compris en euros selon votre région).",
    comingSoon: "Bientôt disponible",
    plans: [
      {
        tierName: "Fenêtre de Mémoire",
        value: "7 jours pour réunir les premiers souvenirs. Un début doux et serein.",
        cta: "Commencer",
      },
      {
        tierName: "Héritage Éternel",
        value: "Préservez chaque photo et chaque récit pour toujours. Sans date d'expiration.",
        cta: "Choisir",
      },
      {
        tierName: "Le Film Éternel",
        value:
          "Tous les avantages d'Héritage Éternel, avec cinq clips hommage IA d'environ 10 secondes chacun — comme des photographies qui s'animent pour retrouver leur présence.",
        cta: "Choisir",
        statusTag: "Bientôt disponible",
      },
    ],
  },
  faq: {
    kicker: "FAQ",
    title: "Réponses en toute sérénité",
    subtitle: "Un accompagnement artisanal pour les familles du monde entier.",
    items: [
      {
        q: "Qu'est-ce qu'Aeterna ?",
        a: "Aeterna est un coffret à trésors numérique pour les souvenirs de ceux que nous aimons, qu'il s'agisse de personnes ou d'animaux. C'est un lieu privilégié où leurs sourires, leurs voix et leurs histoires vivent éternellement, au lieu de se perdre dans la galerie d'un téléphone ou un vieil album poussiéreux.",
      },
      {
        q: "Pourquoi avoir lancé ce projet ?",
        a: "Notre fondateur a créé Aeterna après avoir perdu son père. Il a réalisé qu'il n'existait aucun bel espace partagé pour célébrer une vie numériquement avec élégance. Il a conçu Aeterna pour que personne ne se sente seul dans son deuil, transformant le concept de « sanctuaire » en une célébration vivante de l'amour.",
      },
      {
        q: "Comment créer un mémorial ?",
        a: "C'est aussi simple que de planter une graine. D'abord, créez le profil de votre proche. Ensuite, partagez le lien ou le QR code avec votre entourage. Aucun compte complexe ni application à télécharger : juste un chemin direct vers le partage.",
      },
      {
        q: "Comment les proches peuvent-ils participer ?",
        a: "Dès qu'ils reçoivent le lien, ils peuvent instantanément publier des photos, laisser des mentions « j'aime » ou partager un commentaire chaleureux. C'est comme une étreinte collective où chacun apporte son souvenir préféré pour faire grandir l'histoire.",
      },
      {
        q: "Puis-je l'utiliser lors d'une cérémonie physique ?",
        a: "Oui. Vous pouvez générer une élégante invitation PDF avec un QR code unique. Imprimez-la et déposez-la sur le lieu de la cérémonie. Les visiteurs n'auront qu'à la scanner avec leur téléphone pour contribuer en temps réel.",
      },
      {
        q: "Est-ce sécurisé et privé ?",
        a: "Absolument. Comme un jardin secret, seules les personnes que vous invitez peuvent y accéder. Vos souvenirs ne sont pas des produits publics ; ce sont des trésors sacrés, protégés pour ceux qui ont réellement connu le défunt.",
      },
      {
        q: "Que se passe-t-il sur le long terme ?",
        a: "Nous pensons que les souvenirs doivent rester vivants. Avec Premium, vos photos les plus aimées deviennent cinq clips hommage d’environ 10 secondes — des « images mouvantes » chaleureuses — pour que l’histoire d’une vie demeure vibrante pour les générations futures.",
      },
    ],
  },
  footer: "Pour les professionnels du funéraire et les soignants · hoon@aya.yale.edu",
}

const ES: LandingStrings = {
  nav: { howItWorks: "Cómo funciona", pricing: "Tarifas", faq: "Preguntas frecuentes" },
  hero: {
    title1: "Un santuario digital para el",
    title2: "recuerdo sagrado",
    body:
      "Un espacio perdurable para personas y mascotas, preservado con la máxima dignidad. Comparta al instante mediante código QR o enlace: sin aplicaciones, sin fricciones; los invitados añaden fotos e historias desde cualquier teléfono. Un muro conmemorativo donde los visitantes dejan corazones y comentan cada recuerdo, creando una línea de tiempo sagrada de su legado.",
    tagline: "Huellas, recuerdos y preservación en un solo lugar sagrado.",
    ctaCreate: "Crear un memorial",
    ctaMyMemorial: "Mi espacio",
    heroPortraitAlt:
      "Retrato de una persona mayor en una página conmemorativa — evoca a sus propios familiares.",
    heroSecondaryAlt: "Mascotas y compañeros como parte de la historia familiar.",
  },
  howItWorks: {
    kicker: "Cómo funciona",
    title: "Crear · Compartir · Reunir",
    subtitle:
      "Tres pilares: un santuario digital para humanos y mascotas; acceso sin fricciones mediante QR o enlace sin necesidad de apps; y un memorial comunitario donde los visitantes interactúan para que los momentos más importantes permanezcan siempre presentes.",
    steps: [
      {
        title: "Crear un santuario digital",
        description:
          "Construya un espacio conmemorativo digno para su ser querido o mascota en cuestión de segundos.",
      },
      {
        title: "Escanear y compartir",
        description:
          "Coloque un código QR en el servicio o comparta un enlace. Los invitados suben fotos e historias al instante. No se requiere aplicación.",
      },
      {
        title: "Conectar y revivir",
        description:
          "La comunidad reacciona a sus recuerdos favoritos, y las historias más queridas destacan en la parte superior.",
      },
    ],
  },
  pricing: {
    kicker: "Tarifas",
    title: "Preservación sagrada. Pago único.",
    subtitle:
      "Los primeros 7 días son una ventana gratuita para reunir recuerdos. Mejore su plan en cualquier momento para preservar el santuario por siempre.",
    currencyDisclaimer:
      "La moneda mostrada depende de su región en la primera visita o del idioma seleccionado; puede cambiarla abajo antes de pagar.",
    comingSoon: "Próximamente",
    plans: [
      {
        tierName: "Ventana del Recuerdo",
        value: "7 días para reunir recuerdos. Un comienzo suave y lleno de paz.",
        cta: "Empezar",
      },
      {
        tierName: "Legado Eterno",
        value: "Mantenga cada foto e historia preservada para siempre. Sin fecha de expiración.",
        cta: "Elegir",
      },
      {
        tierName: "La Película Eterna",
        value:
          "Todo lo incluido en Legado Eterno, además de cinco clips tributo con IA de ~10 s cada uno — como fotografías que cobran vida para volver a sentir su presencia.",
        cta: "Elegir",
        statusTag: "Próximamente",
      },
    ],
  },
  faq: {
    kicker: "Preguntas frecuentes",
    title: "Preguntas respondidas con ternura",
    subtitle: "Cuidado artesanal para familias de todo el mundo.",
    items: [
      {
        q: "¿Qué es Aeterna?",
        a: "Aeterna es una caja de tesoros digitales para los recuerdos de quienes amamos: tanto personas como mascotas. Es un lugar especial donde sus sonrisas, voces e historias viven para siempre, en lugar de perderse en la galería de un teléfono o en un álbum empolvado.",
      },
      {
        q: "¿Por qué empezaron este proyecto?",
        a: "Nuestro fundador creó Aeterna tras perder a su padre. Se dio cuenta de que no existía un espacio digital hermoso para celebrar una vida junto a otros. Creó Aeterna para asegurar que nadie tenga que sentirse solo en su recuerdo, convirtiendo un «altar» en una celebración viva del amor.",
      },
      {
        q: "¿Cómo puede iniciar un memorial?",
        a: "Es tan sencillo como plantar una semilla. Primero, cree un perfil para su ser querido. Segundo, comparta un enlace o código QR con familiares y amigos. No hay que descargar aplicaciones ni realizar registros complicados: solo un camino directo para compartir amor.",
      },
      {
        q: "¿Cómo ayudan los amigos y la familia?",
        a: "Una vez que reciben el enlace, pueden subir fotos al instante, dejar un «me gusta» o compartir un comentario conmovedor. Es como un abrazo grupal donde cada uno trae su recuerdo favorito para ayudar a que la historia crezca.",
      },
      {
        q: "¿Puede usarlo en un servicio físico?",
        a: "Sí. Puede crear una hermosa invitación en PDF con un código QR único. Imprímalo y colóquelo en el servicio conmemorativo o envíelo digitalmente. Los visitantes solo tienen que escanearlo con sus teléfonos para contribuir con sus fotos y mensajes en tiempo real.",
      },
      {
        q: "¿Es seguro y privado?",
        a: "Absolutamente. Como un jardín secreto, solo las personas que invite pueden entrar. Sus recuerdos no son productos para el público; son tesoros sagrados mantenidos de forma segura y privada para quienes realmente conocieron al fallecido.",
      },
      {
        q: "¿Qué pasa a largo plazo?",
        a: "Creemos que los recuerdos deben moverse y hablar. Con Premium, sus fotos más queridas se convierten en cinco clips tributo de ~10 s cada uno — como fotografías que cobran vida — para que la historia de una vida siga viva en las generaciones venideras.",
      },
    ],
  },
  footer: "Para profesionales de servicios conmemorativos y proveedores de cuidados · hoon@aya.yale.edu",
}

const AR: LandingStrings = {
  nav: { howItWorks: "كيف يعمل", pricing: "الباقات والأسعار", faq: "الأسئلة الشائعة" },
  hero: {
    title1: "ضريح رقمي",
    title2: "للذكرى المقدسة",
    body: "مساحة باقية للأحبة والحيوانات الأليفة، تُحفظ بكل إجلال. شاركها فوراً عبر رمز QR أو رابط مباشر: بلا تطبيقات، بلا تعقيد؛ يضيف الضيوف الصور والقصص من أي هاتف. سجل ذكريات هادئ يفيض بالمشاعر، حيث يتفاعل الزوار مع كل ذكرى، ليكون جدولاً زمنياً مقدساً لإرثهم.",
    tagline: "الأثر، والذكرى، والخلود.. في مكان واحد مقدس.",
    ctaCreate: "أنشئ ضريحاً الآن",
    ctaMyMemorial: "أضرحتي",
    heroPortraitAlt:
      "صورة مقرّبة لسيدة سعودية مسنّة ترتدي حجابًا يغطي الشعر دون نقاب، تبتسم بحرارة وترفع النظر مباشرة نحو المشاهد.",
    heroSecondaryAlt:
      "كلاب وقطط معًا — رفقاء في البيت يشكلون جزءًا من قصة العائلة على الجدار نفسه.",
  },
  howItWorks: {
    kicker: "كيف يعمل",
    title: "أنشئ · شارك · اجتمع",
    subtitle:
      "ثلاث ركائز: ضريح رقمي للبشر والحيوانات الأليفة؛ وصول سهل عبر رمز QR أو رابط بدون تطبيق؛ وذكرى مجتمعية يتفاعل معها الزوار، لتبقى اللحظات الأغلى حاضرة دائماً.",
    steps: [
      {
        title: "إنشاء ضريح رقمي",
        description: "ابنِ مساحة تذكارية تليق بأحبائك أو حيوانك الأليف في ثوانٍ معدودة.",
      },
      {
        title: "امسح وشارك",
        description:
          "ضع رمز QR في مراسم التأبين أو شارك رابطاً. يرفع الضيوف الصور والقصص فوراً وبكل سهولة.",
      },
      {
        title: "تواصل واستعد الذكريات",
        description:
          "يتفاعل المجتمع مع الذكريات المفضلة، لتتصدر القصص الأكثر تأثيراً المشهد.",
      },
    ],
  },
  pricing: {
    kicker: "الباقات والأسعار",
    title: "حفظ مقدس.. لمرة واحدة فقط.",
    subtitle:
      "أول 7 أيام هي نافذة مجانية لجمع الذكريات. يمكنك الترقية في أي وقت لحفظ الضريح للأبد.",
    currencyDisclaimer:
      "تُحدَّد عملة العرض بحسب منطقتك عند أول زيارة أو بحسب اللغة التي اخترتها. يمكنك تغييرها أدناه قبل إتمام الدفع.",
    comingSoon: "قريباً",
    plans: [
      {
        tierName: "نافذة الذكرى",
        value: "7 أيام لجمع الذكريات. بداية هادئة ومفعمة بالسلام.",
        cta: "ابدأ",
      },
      {
        tierName: "الإرث الأبدي",
        value: "حفظ دائم لكل الصور والقصص للأبد، بدون تاريخ انتهاء.",
        cta: "اختر",
      },
      {
        tierName: "الفيلم الخالد",
        value:
          "كل مزايا «الإرث الأبدي»، بالإضافة إلى خمس مقاطع تكريمية بالذكاء الاصطناعي (~10 ثوانٍ لكل منها) — كصور تتحرك لتشعر بقربهم من جديد.",
        cta: "اختر",
        statusTag: "قريباً",
      },
    ],
  },
  faq: {
    kicker: "الأسئلة الشائعة",
    title: "إجابات برفق",
    subtitle: "رعاية متقنة للعائلات في جميع أنحاء العالم.",
    items: [
      {
        q: "ما هو Aeterna؟",
        a: "هو صندوق كنز رقمي لذكريات من نحب. مكان خاص تعيش فيه ابتساماتهم وأصواتهم وقصصهم للأبد، بدلاً من أن تضيع في ذاكرة الهاتف أو الألبومات المتربة.",
      },
      {
        q: "لماذا بدأتم هذا المشروع؟",
        a: "أسس صاحب المشروع Aeterna بعد فقدان والده. أدرك حينها عدم وجود مساحة رقمية جميلة لمشاركة الاحتفاء بالحياة مع الآخرين، فأنشأ Aeterna لضمان ألا يشعر أحد بالوحدة في ذكراه، محولاً «الضريح» إلى احتفال حي بالحب.",
      },
      {
        q: "كيف أبدأ إنشاء الضريح؟",
        a: "الأمر بسيط كزرع بذرة. أولاً، تنشئ ملفاً تعريفياً لمن تحب. ثانياً، تشارك الرابط أو رمز QR مع العائلة والأصدقاء. لا يوجد تطبيق لتحميله ولا تسجيل دخول معقد، فقط طريق مباشر لمشاركة الحب.",
      },
      {
        q: "كيف يشارك الأصدقاء والعائلة؟",
        a: "بمجرد استلام الرابط، يمكنهم فوراً رفع الصور أو ترك «إعجابات» أو مشاركة تعليقات دافئة. إنه يشبه عناقاً جماعياً حيث يحضر الجميع ذكرياتهم المفضلة لتنمو القصة.",
      },
      {
        q: "هل يمكنني استخدامه في مراسم التأبين الواقعية؟",
        a: "نعم. يمكنك إنشاء دعوة PDF جميلة برمز QR فريد. اطبعه وضعه في مراسم التأبين أو أرسله رقمياً. يمكن للزوار ببساطة مسحه بهواتفهم للمساهمة بصورهم ورسائلهم في الوقت الفعلي.",
      },
      {
        q: "هل هو آمن وخاص؟",
        a: "بكل تأكيد. مثل حديقة سرية، لا يمكن إلا لمن تدعوهم الدخول. ذكرياتكم ليست منتجات للعامة؛ بل هي كنوز مقدسة تُحفظ بخصوصية وأمان لمن عرفوا الفقيد حقاً.",
      },
      {
        q: "ماذا يحدث على المدى الطويل؟",
        a: "نؤمن بأن الذكريات يجب أن تتحرك وتتحدث. مع بريميوم، نحوّل صوركم الأعزّ إلى خمس مقاطع تكريمية بالذكاء الاصطناعي (~10 ثوانٍ لكل منها) — كصور تتحرك بحرارة — لتبقى قصة الحياة حاضرة للأجيال القادمة.",
      },
    ],
  },
  footer: "للمحترفين في تنظيم مراسم التأبين ومقدمي الرعاية · hoon@aya.yale.edu",
}

/** Traditional Chinese (HK/TW) — 典雅書面；重視傳承與追思 */
const ZH: LandingStrings = {
  nav: { howItWorks: "運作方式", pricing: "方案費用", faq: "常見問題" },
  hero: {
    title1: "永恆記憶的",
    title2: "數位殿堂",
    body:
      "為您心愛的家人與寵物，打造一座跨越時光、充滿尊嚴的永恆安息地。無需下載應用程式，僅需透過 QR Code 或專屬連結，即可與親友即時分享照片與故事。這裡是一處溫柔的追思空間，讓訪客在每一份回憶中留下心意與評論，共同編織出一段神聖的生命傳承。",
    tagline: "讓足跡、思念與永恆的守護，在此神聖交匯。",
    ctaCreate: "立即建立追思空間",
    ctaMyMemorial: "我的追思空間",
    heroPortraitAlt: "溫和微笑、凝望觀者的東亞長者肖像。",
    heroSecondaryAlt: "寵物與同伴，家庭敘事中的一頁。",
  },
  howItWorks: {
    kicker: "運作方式",
    title: "記錄 · 分享 · 凝聚",
    subtitle:
      "三大核心：為至親與寵物建立的數位殿堂；無需 App、透過 QR Code 即可輕鬆存取的零門檻體驗；以及讓親友共同參與、讓珍貴瞬間永駐心間的追思社群。",
    steps: [
      {
        title: "建立數位殿堂",
        description: "僅需數秒，即可為您的摯愛或寵物打造一個莊嚴的追思空間。",
      },
      {
        title: "掃描與分享",
        description: "在告別式現場放置 QR Code 或分享連結。親友可立即上傳照片與故事，無需下載任何程式。",
      },
      {
        title: "連結與重溫",
        description:
          "親友可為珍貴的回憶留下「心意」，讓最受動容的故事流傳於空間頂端。",
      },
    ],
  },
  pricing: {
    kicker: "方案費用",
    title: "神聖守護，一次性的永恆禮讚。",
    subtitle: "前 7 天為免費收集回憶的視窗。您可以隨時升級，永久保存這座殿堂。",
    currencyDisclaimer:
      "首次造訪時依地區、之後依您選擇的語言決定顯示幣別；結帳前可於下方變更，亦可手動切換為港幣、台幣等。",
    comingSoon: "即將推出",
    plans: [
      {
        tierName: "記憶之窗",
        value: "開啟為期 7 天的回憶收集。一個溫柔且平和的開端。",
        cta: "開始",
      },
      {
        tierName: "永恆傳承",
        value: "永久保存每一張照片與故事，永不過期。",
        cta: "選擇",
      },
      {
        tierName: "永恆影卷",
        value: "包含「永恆傳承」所有功能，並享有五段 AI 追思短片（各約 10 秒）優先製作 — 如會動的照片，再次與摯愛相遇。",
        cta: "選擇",
        statusTag: "即將推出",
      },
    ],
  },
  faq: {
    kicker: "常見問題",
    title: "溫柔的解答",
    subtitle: "為全球家庭提供匠心守護與關懷。",
    items: [
      {
        q: "什麼是 Aeterna？",
        a: "Aeterna 是存放摯愛回憶的數位寶盒。這是一個專屬的空間，讓他們的笑容、聲音與故事得以永恆長存，不再遺失在手機相簿或封塵的相冊中。",
      },
      {
        q: "為什麼創立這個平台？",
        a: "我們的創辦人在失去父親後創立了 Aeterna。他意識到目前缺乏一個優雅且能讓親友共同慶賀生命的數位空間。他創立 Aeterna，是為了確保沒有人在追思的路上感到孤單，將「祭壇」化為一場愛的生動慶典。",
      },
      {
        q: "如何開始建立追思空間？",
        a: "就像播下一顆種子一樣簡單。首先，為您的摯愛建立檔案；接著，與親友分享連結或 QR Code。無需下載應用程式，也無需複雜的登入過程，直接開啟分享愛的渠道。",
      },
      {
        q: "親友如何參與？",
        a: "收到連結後，他們可以立即上傳照片、點下「心意」或留下暖心的評論。這就像是一場集體的擁抱，每個人都帶來自己最珍藏的回憶，讓故事更加完整。",
      },
      {
        q: "可以在實體告別式使用嗎？",
        a: "可以。您可以建立帶有專屬 QR Code 的精美 PDF 邀請函。將其列印並放置在告別式現場，或以數位方式傳送。訪客只需用手機掃描，即可即時貢獻照片與訊息。",
      },
      {
        q: "平台安全且隱私嗎？",
        a: "絕對安全。如同私人花園，只有您邀請的人才能進入。您的回憶不是公開的商品，而是為真正了解逝者的人所守護的神聖寶藏。",
      },
      {
        q: "長期而言會如何運作？",
        a: "我們相信回憶應該是鮮活且流動的。進階方案會將您最珍視的照片化為五段 AI 追思短片（各約 10 秒），如會動的畫面般溫暖，讓生命故事在世代間延續。",
      },
    ],
  },
  footer: "生命禮儀專業人士與護理機構合作洽詢 · hoon@aya.yale.edu",
}

export const LANDING_COPY: Record<LandingLocale, LandingStrings> = {
  en: EN,
  ko: KO,
  ja: JA,
  fr: FR,
  es: ES,
  ar: AR,
  zh: ZH,
  "zh-hk": ZH,
}

export function isLandingLocale(x: string | null | undefined): x is LandingLocale {
  return (
    x === "en" ||
    x === "ko" ||
    x === "ja" ||
    x === "fr" ||
    x === "es" ||
    x === "ar" ||
    x === "zh" ||
    x === "zh-hk"
  )
}

export function getLandingStrings(locale: LandingLocale): LandingStrings {
  return LANDING_COPY[locale] ?? EN
}
