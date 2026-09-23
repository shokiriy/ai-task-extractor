# Local AI chatbotni mustaqil qurish va o'rganish

Bu qo'llanma hozirgi loyihani Windows kompyuterda noldan ishga tushirish va uning AI qismini qo'lda qayta qurib o'rganish uchun yozilgan.

Texnologiyalar:

- Java 21 va Spring Boot;
- Spring AI `ChatClient`;
- Ollama va `qwen3.5:9b` lokal modeli;
- React, TypeScript va Vite;
- MySQL 8.4 va Docker Compose.

Qo'llanmadagi amallarni ketma-ket bajarsangiz, quyidagi natijaga kelasiz:

```text
Brauzer: http://localhost:5173
Backend: http://localhost:8080
Ollama:  http://localhost:11434
MySQL:   localhost:3308
```

Chatga o'zbekcha savol yuborish mumkin:

```text
Bugungi sana haqida qisqacha aytib ber
```

Kutiladigan javob sana o'zgarganiga qarab dinamik bo'ladi:

```text
Bugun 2026-yil 23-sentabr, chorshanba.
```

## Qo'llanmadan qanday foydalanish kerak?

- Faqat loyihani tez ishga tushirmoqchi bo'lsangiz: `1`, `2`, `3` va `8`-bo'limlarni bajaring.
- Backend AI kodini tushunmoqchi bo'lsangiz: `4` va `5`-bo'limlarni yozib chiqing.
- Frontend chatni tushunmoqchi bo'lsangiz: `6`-bo'limni bajaring.
- Model sifati va diagnostikani o'rganmoqchi bo'lsangiz: `7`, `8`, `9` va `10`-bo'limlarni o'qing.
- Mustaqil AI engineering reja kerak bo'lsa: `11` va `12`-bo'limlardan foydalaning.
- Rasmiy manbalar: `15`-bo'limda.

Birinchi o'tishda hamma kodni yodlashga urinmang. Avval tizimni ishga tushiring, keyin har bir qatlamni alohida qayta yozing.

---

## 1. Avval arxitekturani tushunib oling

Bu loyiha bitta repository ichida, lekin ishga tushganda to'rtta alohida jarayon ishlaydi:

```text
Foydalanuvchi
    |
    v
React + Vite :5173
    |
    | POST /api/v1/chat
    v
Spring Boot :8080
    |
    | Spring AI ChatClient
    v
Ollama :11434 ----> qwen3.5:9b

Spring Boot :8080 ----> MySQL :3308
```

Har bir qismning vazifasi:

| Qism | Vazifasi |
|---|---|
| React | Xabarni olish, chat tarixini ko'rsatish va backendga yuborish |
| Spring Boot | Validatsiya, system prompt, vaqt, xatolar va AI chaqiruvini boshqarish |
| Spring AI | Java kodi bilan Ollama o'rtasidagi adapter |
| Ollama | Lokal modelni yuklash va inference qilish |
| `qwen3.5:9b` | Matnni tushunish va javob yaratish |
| MySQL | Task analysis ma'lumotlarini saqlash; hozirgi chat tarixi MySQL'da saqlanmaydi |

Muhim: frontend va backend bitta repositoryda bo'lsa ham, development vaqtida ular ikki xil portda ishlaydi. Shu sabab CORS sozlamasi kerak.

---

## 2. Kerakli kompyuter va dasturlar

### Kompyuter resurslari

`qwen3.5:9b` modeli uchun amaliy tavsiya:

- kamida 16 GB RAM;
- yaxshisi 24 yoki 32 GB RAM;
- diskda kamida 15 GB bo'sh joy;
- zamonaviy 6+ yadroli CPU;
- alohida GPU shart emas, lekin GPU bo'lmasa javob sekinroq keladi.

Bu kompyuterda 32 GB RAM va 10 yadroli i7 bor. Model CPU orqali taxminan 15-30 soniyada javob berishi mumkin. Birinchi javob model RAM'ga yuklangani uchun sekinroq bo'ladi.

Agar kompyuteringiz kuchsizroq bo'lsa, `qwen3.5:4b` ishlatishingiz mumkin. U tezroq va kichikroq, lekin o'zbekcha sifatida 9B modeldan yomonroq bo'lishi mumkin.

### Kerakli dasturlar

1. Git - repository bilan ishlash uchun.
2. JDK 21 - Java backend uchun.
3. Maven 3.9+ - backendni build va run qilish uchun.
4. Node.js LTS va npm - frontend uchun.
5. Docker Desktop - MySQL konteyneri uchun.
6. Ollama - lokal AI model serveri uchun.
7. IntelliJ IDEA yoki VS Code - kod yozish uchun.
8. Postman ixtiyoriy - API test qilish uchun. PowerShellning o'zi ham yetadi.

### Windowsda o'rnatish

PowerShell oching:

```powershell
winget install --id Git.Git --exact
winget install --id EclipseAdoptium.Temurin.21.JDK --exact
winget install --id OpenJS.NodeJS.LTS --exact
winget install --id Docker.DockerDesktop --exact
winget install --id Ollama.Ollama --exact
```

Maven uchun hozir `winget` katalogida rasmiy `Apache.Maven` paketi yo'q. Uni quyidagicha o'rnating:

1. [Apache Maven rasmiy sahifasi](https://maven.apache.org/download.cgi)dan binary ZIP faylini yuklang.
2. ZIP'ni masalan `C:\Tools\apache-maven-3.9.16` ichiga oching.
3. Windows `Environment Variables` oynasida `MAVEN_HOME` nomli user variable yarating va ochilgan Maven papkasini qiymat qilib bering.
4. User `Path` ichiga `%MAVEN_HOME%\bin` qo'shing.
5. Barcha terminallarni yopib, yangi PowerShell oching.

Agar boshqa `winget` paketi topilmasa, ushbu qo'llanmaning oxiridagi rasmiy yuklab olish havolasidan foydalaning.

O'rnatishdan keyin barcha terminallarni yoping va yangi PowerShell oching. So'ng tekshiring:

```powershell
git --version
java -version
mvn -version
node --version
npm --version
docker version
ollama --version
```

Biror buyruq `not recognized` desa, odatda sabab terminal eski `PATH` bilan ochiq qolganidir. Terminalni qayta oching.

---

## 3. Tez yo'l: hozirgi loyihani ishga tushirish

Bu bo'lim mavjud kodni o'zgartirmasdan ishga tushiradi.

### 3.1. Project root papkasiga o'ting

```powershell
Set-Location D:\StarSchool\ai-task-extractor
```

Barcha keyingi backend va Docker buyruqlarini shu papkada bajaring.

### 3.2. `.env` faylini yarating

```powershell
Copy-Item .env.example .env
```

`.env` ichida quyidagi qiymatlar bo'lsin:

```dotenv
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3.5:9b
APP_TIME_ZONE=Asia/Tashkent
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173

DB_HOST=127.0.0.1
DB_PORT=3308
DB_NAME=ai_task_extractor
DB_USER=ai_task_user
DB_PASSWORD=change-me
DB_ROOT_PASSWORD=change-root-me
```

Nega `3308`? Ushbu kompyuterda `3306` portini boshqa MySQL ishlatgan. Sizda `3306` bo'sh bo'lsa, `DB_PORT=3306` ishlatishingiz mumkin.

`.env` Git'ga commit qilinmaydi. `.env.example` esa xavfsiz namuna sifatida repositoryda qoladi.

### 3.3. Docker Desktop'ni ishga tushiring

Docker Desktop dasturini oching va engine tayyor bo'lishini kuting. Tekshirish:

```powershell
docker version
```

Server qismi ko'rinsa, Docker ishlayapti.

### 3.4. MySQL'ni ishga tushiring

```powershell
docker compose up -d
docker compose ps
```

`ai-task-extractor-mysql` holati `healthy` bo'lishi kerak. Birinchi ishga tushishda 20-40 soniya kutish mumkin.

Loglarni ko'rish:

```powershell
docker compose logs mysql
```

### 3.5. Ollama ishlayotganini tekshiring

Ollama Windows installer odatda lokal servisni avtomatik ishga tushiradi:

```powershell
Invoke-RestMethod http://localhost:11434/api/tags
```

Agar ulanish bo'lmasa, alohida PowerShell oynasida:

```powershell
ollama serve
```

Bu oynani yopmang.

### 3.6. Modelni yuklang

Model bir marta yuklanadi va kompyuterda saqlanadi:

```powershell
ollama pull qwen3.5:9b
ollama list
```

Ro'yxatda `qwen3.5:9b` bo'lishi kerak.

### 3.7. Modelni backenddan oldin alohida test qiling

Bu test Ollama va modelning o'zi ishlayotganini isbotlaydi:

```powershell
$ollamaBody = @{
    model = "qwen3.5:9b"
    think = $false
    messages = @(
        @{
            role = "user"
            content = "O'zbek tilida salomlash"
        }
    )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
    -Method Post `
    -Uri http://localhost:11434/api/chat `
    -ContentType "application/json; charset=utf-8" `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($ollamaBody))
```

Bu ishlamasa, Spring Boot'ni tekshirishga hali o'tmang. Avval Ollama muammosini hal qiling.

### 3.8. Backendni ishga tushiring

Yangi PowerShell oynasida project root ichidan:

```powershell
mvn spring-boot:run
```

Log oxirida shunga o'xshash yozuv bo'lishi kerak:

```text
Tomcat started on port 8080
Started AiTaskExtractorApplication
```

Backend oynasini yopmang.

### 3.9. Frontend dependency'larini o'rnating

Uchinchi PowerShell oynasida:

```powershell
Set-Location D:\StarSchool\ai-task-extractor\frontend
npm install
```

### 3.10. Frontendni ishga tushiring

```powershell
npm run dev
```

Vite odatda quyidagi manzilni beradi:

```text
http://localhost:5173
```

Brauzerda shu manzilni oching.

### 3.11. API'ni PowerShell bilan tekshiring

```powershell
$chatBody = @{
    messages = @(
        @{
            role = "USER"
            content = "Bugungi sana haqida qisqacha aytib ber"
        }
    )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
    -Method Post `
    -Uri http://localhost:8080/api/v1/chat `
    -ContentType "application/json; charset=utf-8" `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($chatBody))
```

Kutiladigan response shakli:

```json
{
  "message": "Bugun 2026-yil 23-sentabr, chorshanba."
}
```

Sana tabiiy ravishda bugungi sanaga qarab o'zgaradi.

### 3.12. Frontend build'ni tekshiring

Frontend papkasida:

```powershell
npm run build
```

Bu TypeScript xatolarini tekshiradi va production build yaratadi.

---

## 4. Chat API qanday ishlaydi?

Minimal request:

```json
{
  "messages": [
    {
      "role": "USER",
      "content": "Salom"
    }
  ]
}
```

Davomli suhbat uchun avvalgi xabarlar ham yuboriladi:

```json
{
  "messages": [
    {
      "role": "USER",
      "content": "Spring Boot nima?"
    },
    {
      "role": "ASSISTANT",
      "content": "Spring Boot Java ilovalarini tez yaratishga yordam beradi."
    },
    {
      "role": "USER",
      "content": "Bitta misol ber"
    }
  ]
}
```

Rollar:

| Rol | Ma'nosi |
|---|---|
| `SYSTEM` | Ilova tomonidan beriladigan yashirin qoida va faktlar |
| `USER` | Foydalanuvchi xabari |
| `ASSISTANT` | Modelning avvalgi javobi |

Hozir frontend eng oxirgi 20 ta xabarni yuboradi. Bu modelga suhbat kontekstini beradi va juda katta prompt yuborilishining oldini oladi.

Chat tarixi hozir faqat React state ichida turadi. Sahifani yangilasangiz yoki `Suhbatni tozalash` tugmasini bossangiz, tarix tozalanadi.

---

## 5. AI backendni qo'lda qurish

Bu bo'limdagi fayllar hozir repositoryda mavjud. O'rganish uchun ularni o'zingiz qayta yozib ko'ring. Eng yaxshi usul: faylni o'qish, yopish va xotiradan qayta yozish.

### 5.1. Spring AI dependency qo'shish

`pom.xml` ichida Spring AI BOM versiyasi bor:

```xml
<properties>
    <java.version>21</java.version>
    <spring-ai.version>2.0.1</spring-ai.version>
</properties>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-bom</artifactId>
            <version>${spring-ai.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

Ollama starter:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-ollama</artifactId>
</dependency>
```

REST va validatsiya uchun:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

`spring-ai-starter-model-ollama` konfiguratsiyaga qarab `ChatClient.Builder` yaratib beradi. Biz provider HTTP kodini qo'lda yozmaymiz.

### 5.2. Ollama konfiguratsiyasini yozish

[application.yml](src/main/resources/application.yml) ichidagi muhim qism:

```yaml
spring:
  config:
    import: optional:file:.env[.properties]
  ai:
    model:
      chat: ollama
    ollama:
      base-url: ${OLLAMA_BASE_URL:http://localhost:11434}
      chat:
        model: ${OLLAMA_MODEL:qwen3.5:9b}
        think: false
        temperature: 0.2
        num-predict: 512

app:
  ai:
    time-zone: ${APP_TIME_ZONE:Asia/Tashkent}
```

Parametrlar:

| Parametr | Nega kerak? |
|---|---|
| `model` | Qaysi Ollama modelini chaqirishni tanlaydi |
| `think: false` | Oddiy chatda ichki reasoning chiqishini o'chiradi |
| `temperature: 0.2` | Javobni kamroq tasodifiy va barqarorroq qiladi |
| `num-predict: 512` | Javob maksimal uzunligini cheklaydi |
| `time-zone` | Bugungi sana va vaqtni to'g'ri hisoblaydi |

### 5.3. `ChatClient` va `Clock` bean'larini yarating

Aniq kod: [AiConfiguration.java](src/main/java/com/shokirjon/aitaskextractor/ai/config/AiConfiguration.java)

```java
@Configuration
public class AiConfiguration {

    @Bean
    ChatClient chatClient(ChatClient.Builder builder) {
        return builder.build();
    }

    @Bean
    Clock applicationClock(
            @Value("${app.ai.time-zone:Asia/Tashkent}") String timeZone
    ) {
        return Clock.system(ZoneId.of(timeZone));
    }
}
```

Nega `Clock` alohida bean? Vaqtni servis ichida yashirin chaqirish o'rniga dependency sifatida beramiz. Keyinchalik testda soatni aniq qiymatga muzlatish mumkin.

### 5.4. Request va response DTO'larini yarating

Papka:

```text
src/main/java/com/shokirjon/aitaskextractor/chat/dto/
```

`ChatRole.java`:

```java
public enum ChatRole {
    USER,
    ASSISTANT
}
```

`ChatMessageRequest.java`:

```java
public record ChatMessageRequest(
        @NotNull(message = "role is required")
        ChatRole role,

        @NotBlank(message = "content must not be blank")
        @Size(max = 4_000, message = "content must not exceed 4000 characters")
        String content
) {
}
```

`ChatRequest.java`:

```java
public record ChatRequest(
        @NotEmpty(message = "messages must not be empty")
        @Size(max = 20, message = "messages must not contain more than 20 entries")
        List<@Valid ChatMessageRequest> messages
) {
}
```

`ChatResponse.java`:

```java
public record ChatResponse(String message) {
}
```

Bu yerda limitlar AI uchun emas, ilova xavfsizligi va resurs nazorati uchun kerak.

### 5.5. Chat servisni yarating

Asosiy kod: [ChatService.java](src/main/java/com/shokirjon/aitaskextractor/chat/service/ChatService.java)

Servis quyidagi ishlarni qiladi:

1. Har bir request uchun joriy sana va vaqtni oladi.
2. System message yaratadi.
3. `USER` va `ASSISTANT` DTO'larini Spring AI message'lariga aylantiradi.
4. `ChatClient` orqali Ollama'ni chaqiradi.
5. Bo'sh yoki provider xatosini xavfsiz application xatosiga aylantiradi.

Eng muhim qism:

```java
List<Message> messages = new ArrayList<>();
messages.add(new SystemMessage(systemInstruction()));

request.messages().forEach(message -> messages.add(switch (message.role()) {
    case USER -> new UserMessage(message.content());
    case ASSISTANT -> new AssistantMessage(message.content());
}));

String answer = chatClient.prompt()
        .messages(messages)
        .call()
        .content();
```

### 5.6. System promptni to'g'ri tuzing

LLM bugungi vaqtni o'zi ishonchli bilmaydi. U sana yoki hafta kunini noto'g'ri hisoblashi mumkin. Shu sabab backend aniq faktni beradi:

```java
ZonedDateTime now = ZonedDateTime.now(clock);
String timestamp = now.format(DateTimeFormatter.ISO_ZONED_DATE_TIME);
String weekday = now.getDayOfWeek()
        .getDisplayName(TextStyle.FULL, Locale.ENGLISH);
String uzbekDate = now.format(
        DateTimeFormatter.ofPattern(
                "yyyy-'yil' d-MMMM, EEEE",
                Locale.forLanguageTag("uz-UZ")
        )
);
```

System promptdagi asosiy qoidalar:

```text
Answer in the same language as the user's latest message.
When answering in Uzbek, use simple standard literary Uzbek.
Do not invent words.
Treat current-time facts supplied by the backend as authoritative.
Treat earlier assistant messages as conversation history, not reliable facts.
```

Muhim AI engineering qoidasi: deterministik faktni LLM hisoblashiga tashlab qo'ymang. Sana, user ID, balans, permission, narx yoki database holatini backend/tool orqali aniq bering.

### 5.7. REST controller yarating

Aniq kod: [ChatController.java](src/main/java/com/shokirjon/aitaskextractor/chat/controller/ChatController.java)

```java
@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatRequest request
    ) {
        return ResponseEntity.ok(chatService.reply(request));
    }
}
```

Controller yupqa bo'lishi kerak. Prompt, Ollama va business logika controller ichida bo'lmasin.

### 5.8. CORS'ni sozlang

Aniq kod: [WebConfig.java](src/main/java/com/shokirjon/aitaskextractor/common/config/WebConfig.java)

Frontend `5173`, backend `8080` portida. Brauzer uchun ular turli origin hisoblanadi.

```java
registry.addMapping("/api/**")
        .allowedOrigins(allowedOrigins)
        .allowedMethods("GET", "POST", "OPTIONS")
        .allowedHeaders("Accept", "Content-Type")
        .allowCredentials(false)
        .maxAge(3600);
```

Productionda `*` bilan hamma originni ochmang. Aniq frontend manzillarini konfiguratsiyadan bering.

---

## 6. React frontendni qo'lda qurish

### 6.1. Chat type'larini yarating

Aniq fayl: [chat.ts](frontend/src/types/chat.ts)

```ts
export type ChatRole = 'USER' | 'ASSISTANT';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatResponse {
  message: string;
}
```

Frontend va backenddagi enum qiymatlari aynan bir xil bo'lishi kerak.

### 6.2. API client yozing

Aniq fayl: [chatApi.ts](frontend/src/api/chatApi.ts)

Asosiy chaqiruv:

```ts
const API_BASE_URL = 'http://localhost:8080';

const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ messages }),
  signal,
});
```

Real kod `VITE_API_BASE_URL` bo'lsa undan foydalanadi, bo'lmasa `http://localhost:8080` ni oladi.

### 6.3. Chat state yarating

Aniq UI: [ChatApp.tsx](frontend/src/ChatApp.tsx)

Kerakli state:

```ts
const [messages, setMessages] = useState<DisplayMessage[]>([]);
const [input, setInput] = useState('');
const [isSending, setIsSending] = useState(false);
const [error, setError] = useState<UiError | null>(null);
```

Yangi user xabari qo'shiladi:

```ts
const userMessage = {
  id: nextId.current++,
  role: 'USER' as const,
  content,
};

const nextMessages = [...messages, userMessage];
setMessages(nextMessages);
```

Oxirgi 20 ta xabar backendga yuboriladi:

```ts
const context = nextMessages
  .slice(-20)
  .map(({ role, content }) => ({ role, content }));

const response = await sendChatMessage(context, controller.signal);
```

Response assistant xabari sifatida qo'shiladi:

```ts
setMessages((current) => [
  ...current,
  {
    id: nextId.current++,
    role: 'ASSISTANT',
    content: response.message,
  },
]);
```

### 6.4. Nega assistant xabarlari ham yuboriladi?

Agar faqat oxirgi user xabarini yuborsangiz, model avvalgi suhbatni bilmaydi:

```text
USER: Spring Boot nima?
ASSISTANT: ...
USER: Endi misol ber.
```

`Endi misol ber` gapining ma'nosi oldingi xabarsiz tushunarsiz. Shu sabab history kerak.

Lekin noto'g'ri assistant javobi history'da qolsa, keyingi javobni ham buzishi mumkin. Shu sabab:

- system prompt oldingi assistant xabarlarini mutlaq fakt deb qabul qilmaydi;
- foydalanuvchi chatni tozalashi mumkin;
- frontend history hajmini cheklaydi;
- muhim faktlar backenddan qayta beriladi.

---

## 7. Modelni qanday tanlash kerak?

Model nomidagi `4b`, `9b` kabi qiymatlar taxminiy parametrlar sonini bildiradi. Odatda katta model sifatliroq, lekin ko'proq RAM va vaqt talab qiladi.

| Model | Taxminiy fayl hajmi | Qachon ishlatish? |
|---|---:|---|
| `qwen3.5:4b` | 3.4 GB | Tezroq demo, RAM kamroq, sifat talabi pastroq |
| `qwen3.5:9b` | 6.6 GB | O'zbekcha va umumiy chat uchun tavsiya |
| Kattaroq model | 17+ GB | Kuchli GPU/RAM va yuqori sifat kerak bo'lsa |

Biz avval `llama3.2:3b` ishlatdik. U inglizcha oddiy savolga javob berdi, lekin o'zbekcha matnda ma'nosiz gaplar yaratdi. `qwen3.5:4b` yaxshiroq bo'ldi, ammo ba'zi texnik so'zlarni to'qidi. `qwen3.5:9b` hozirgi kompyuterda sifat va tezlik bo'yicha yaxshiroq muvozanat berdi.

Modelni almashtirish:

```powershell
ollama pull qwen3.5:4b
```

`.env`:

```dotenv
OLLAMA_MODEL=qwen3.5:4b
```

So'ng backendni qayta ishga tushiring.

Muhim: har bir modelni o'zingizning real o'zbekcha savollaringiz bilan baholang. Model tavsifi yaxshi bo'lishi sizning use case'ingizda avtomatik ravishda yaxshi degani emas.

---

## 8. Eng ko'p uchraydigan xatolar

### `502 AI_PROVIDER_ERROR`

Misol:

```json
{
  "status": 502,
  "error": "AI_PROVIDER_ERROR",
  "message": "The local AI model could not answer"
}
```

Tekshirish tartibi:

```powershell
Invoke-RestMethod http://localhost:11434/api/tags
ollama list
```

Keyin `.env` ichidagi model nomi `ollama list` natijasi bilan bir xil ekanini tekshiring.

### `Connection refused` yoki Ollama ulanmaydi

```powershell
ollama serve
```

Yoki Ollama Windows ilovasini qayta oching.

### `model not found`

```powershell
ollama pull qwen3.5:9b
```

### O'zbekcha javob ma'nosiz

1. Kattaroq multilingual model ishlating.
2. `temperature`ni `0.1-0.3` oralig'ida sinang.
3. System promptda sodda adabiy o'zbek tilini talab qiling.
4. Oldingi noto'g'ri chat history'ni tozalang.
5. Muhim faktni prompt orqali backenddan bering.
6. Bir savolni kamida 5 marta va 20-30 xil savol bilan baholang.

### Bugungi sana yoki hafta kuni noto'g'ri

LLM kalendar emas. Joriy sanani model hisoblamasin. Backend `Clock`, timezone, date va weekday qiymatini system promptga qo'shsin.

### Birinchi javob juda sekin

Bu odatiy. Model diskdan RAM'ga yuklanadi. Keyingi request tezroq bo'ladi. Katta model CPU'da doim GPU'dan sekinroq ishlaydi.

### MySQL `3306` port band

`.env` ichida:

```dotenv
DB_PORT=3308
```

So'ng:

```powershell
docker compose down
docker compose up -d --force-recreate
```

### MySQL paroli mos kelmaydi

MySQL volume birinchi yaratilgandagi parolni saqlaydi. `.env` parolini keyin o'zgartirish eski database parolini avtomatik o'zgartirmaydi.

Agar database ichidagi ma'lumotlar kerak bo'lmasa, quyidagi buyruq volume va barcha lokal DB ma'lumotlarini o'chiradi:

```powershell
docker compose down -v
docker compose up -d
```

`down -v` destruktiv. Muhim ma'lumot bo'lsa ishlatmang.

### Frontend backendga ulana olmaydi

Tekshiring:

1. Backend `8080` portda ishlayaptimi?
2. `VITE_API_BASE_URL=http://localhost:8080` to'g'rimi?
3. `APP_CORS_ALLOWED_ORIGINS=http://localhost:5173` to'g'rimi?
4. Backend konfiguratsiya o'zgargandan keyin restart qilindimi?

### Maven yoki Node topilmaydi

Yangi terminal oching. Keyin:

```powershell
java -version
mvn -version
node --version
npm --version
```

---

## 9. Har safar ishlatadigan diagnostika tartibi

Muammoni yuqoridan pastga taxmin qilib qidirmang. Pastki qatlamdan boshlab tekshiring:

1. Model o'rnatilganmi?

   ```powershell
   ollama list
   ```

2. Ollama API ishlayaptimi?

   ```powershell
   Invoke-RestMethod http://localhost:11434/api/tags
   ```

3. Ollama'ga bevosita request ishlayaptimi?

   `3.7` bo'limidagi direct API testni bajaring.

4. MySQL healthy holatdami?

   ```powershell
   docker compose ps
   ```

5. Backend ishlayaptimi?

   ```powershell
   Invoke-RestMethod 'http://localhost:8080/api/v1/task-analyses?page=0&size=1'
   ```

6. Chat endpoint ishlayaptimi?

   `3.11` bo'limidagi testni bajaring.

7. Frontend ochilayaptimi?

   ```powershell
   Invoke-WebRequest -UseBasicParsing http://localhost:5173
   ```

8. Faqat shundan keyin brauzer UI muammosini tekshiring.

Bu usul qaysi qatlam buzilganini tez topadi.

---

## 10. AI engineeringning asosiy tushunchalari

### Model va application bir narsa emas

Model faqat ehtimoliy matn yaratadi. Application esa:

- inputni tekshiradi;
- haqiqiy faktlarni beradi;
- permissionni tekshiradi;
- database bilan ishlaydi;
- xatolarni boshqaradi;
- model javobini foydalanuvchiga xavfsiz yetkazadi.

### System prompt xavfsizlik devori emas

System prompt model xulqini yo'naltiradi, lekin 100% kafolat bermaydi. Muhim xavfsizlik qoidalari oddiy Java kodida tekshirilishi kerak.

### Hallucination

Model ishonchli ohangda noto'g'ri javob berishi mumkin. Sana misolida kichik model hafta kunini noto'g'ri hisoblagan edi. Yechim promptni shunchaki uzaytirish emas, aniq faktni backenddan berish bo'ldi.

### Grounding

Modelga haqiqiy ma'lumotni tashqi manbadan berish grounding deyiladi. Hozir sana `Clock` orqali grounded. Keyinchalik hujjatlar RAG orqali, biznes ma'lumotlari tool yoki database orqali beriladi.

### Context va history poisoning

Model avvalgi `ASSISTANT` xabarlarini ham kontekst deb ko'radi. Noto'g'ri javob keyingi javobni buzishi mumkin. Shuning uchun history limit, system facts va clear-chat kerak.

### Temperature

- `0.0-0.2`: faktual, barqaror, kam ijodiy;
- `0.5-0.8`: ijodiyroq, lekin xato ehtimoli yuqoriroq;
- yuqori qiymat har doim sifatli degani emas.

### Evals

Modelni “menga yaxshi ko'rindi” deb baholamang. 20-50 ta real o'zbekcha savol tuzing va quyidagilarni yozib boring:

- fakt to'g'rimi;
- til tabiymi;
- ko'rsatmaga rioya qildimi;
- javob vaqti qancha;
- bo'sh yoki xato response bo'ldimi.

---

## 11. Tez o'rganish uchun 14 kunlik yo'l xaritasi

Har kuni 1.5-2 soat kod yozish yetarli. Faqat video ko'rmang; har kuni ishlaydigan kichik natija chiqaring.

| Kun | Mavzu | Amaliy natija |
|---:|---|---|
| 1 | Java, Maven va HTTP asoslari | Oddiy Spring Boot `/hello` endpoint |
| 2 | JSON, DTO va validation | Validatsiyali POST endpoint |
| 3 | Ollama va model tushunchasi | Ollama API'ga direct request |
| 4 | Spring AI `ChatClient` | Backenddan bitta AI javobi |
| 5 | Message rollari va prompt | `SYSTEM`, `USER`, `ASSISTANT` bilan chat |
| 6 | React state va fetch | Bitta xabarli chat UI |
| 7 | Multi-turn context | Oxirgi 20 xabarli suhbat |
| 8 | Error handling va CORS | Xatoni foydalanuvchiga toza ko'rsatish |
| 9 | Model tanlash va parametrlar | 4B va 9B modelni solishtirish |
| 10 | Structured output | Matndan typed Java record olish |
| 11 | MySQL va Flyway | AI natijasini saqlash |
| 12 | Embeddings tushunchasi | Matnlar o'xshashligini sinash |
| 13 | RAG | Kichik hujjatdan savol-javob |
| 14 | Evals va observability | Test savollari, latency va quality jadvali |

Shundan keyingi tartib:

```text
Structured Output
    -> Prompt/Context Engineering
    -> Embeddings
    -> RAG
    -> Tool Calling
    -> Agent Loop
    -> MCP
    -> Evals va Observability
```

Agent yoki RAG'ga juda erta o'tmang. Avval oddiy chat, prompt, context, validation va error handlingni yaxshi tushuning.

---

## 12. O'zingiz bajaradigan foydali mashqlar

1. `temperature`ni `0.0`, `0.2` va `0.8` qilib bir xil 20 savolni solishtiring.
2. `qwen3.5:4b` va `qwen3.5:9b` javoblarini jadvalga yozing.
3. Chat tarixini MySQL'da saqlang.
4. Har conversation uchun UUID yarating.
5. Response'ni SSE orqali tokenma-token stream qiling.
6. 30 ta o'zbekcha eval savoli yarating.
7. Prompt versiyasini database yoki logda saqlang.
8. Model nomi va response vaqtini log qiling.
9. Foydalanuvchiga model tanlash imkonini bering.
10. Task extractor endpointini Ollama bilan alohida tekshiring.
11. Keyin kichik RAG qo'shing: 3-5 ta Markdown hujjatdan javob bersin.
12. Eng oxirida tool calling qo'shing: masalan, backenddagi real vaqt yoki task qidirish funksiyasi.

Har bir mashqni alohida Git branch'da bajaring. Bir vaqtning o'zida ko'p feature qo'shmang.

---

## 13. Ishni to'xtatish va qayta boshlash

Frontend va backend oynalarida:

```text
Ctrl + C
```

MySQL'ni to'xtatish:

```powershell
docker compose stop
```

Qayta boshlash:

```powershell
docker compose up -d
mvn spring-boot:run
```

Boshqa terminalda:

```powershell
Set-Location frontend
npm run dev
```

Ollama Windows service odatda fon rejimida ishlashda davom etadi.

---

## 14. Yakuniy tekshiruv ro'yxati

Quyidagilarning hammasi bajarilsa loyiha tayyor:

- [ ] `java -version` Java 21 ko'rsatadi.
- [ ] `mvn -version` ishlaydi.
- [ ] `node --version` loyiha talabiga mos.
- [ ] `docker compose ps` MySQL'ni `healthy` ko'rsatadi.
- [ ] `ollama list` ichida `qwen3.5:9b` bor.
- [ ] `http://localhost:11434/api/tags` javob beradi.
- [ ] Backend `8080` portida ishga tushgan.
- [ ] `POST /api/v1/chat` HTTP 200 qaytaradi.
- [ ] Frontend `http://localhost:5173` da ochiladi.
- [ ] O'zbekcha sana savoli to'g'ri javob beradi.
- [ ] Eski noto'g'ri history bo'lsa, clear-chat ishlaydi.
- [ ] `npm run build` xatosiz tugaydi.

---

## 15. Rasmiy o'rganish resurslari

Avval ushbu loyiha bilan amaliyot qiling, keyin kerak bo'lgan bo'limni rasmiy hujjatdan o'qing.

### Muhit va asosiy vositalar

- [Java 21 Temurin](https://adoptium.net/temurin/releases/?version=21)
- [Apache Maven o'rnatish](https://maven.apache.org/install)
- [Node.js yuklab olish](https://nodejs.org/en/download)
- [Docker Desktop Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Ollama Windows](https://ollama.com/download/windows)
- [Qwen 3.5 model sahifasi](https://ollama.com/library/qwen3.5)

### Spring va AI

- [Spring Initializr](https://start.spring.io/)
- [Spring Boot getting started](https://spring.io/guides/gs/spring-boot)
- [Spring AI Ollama](https://docs.spring.io/spring-ai/reference/api/chat/ollama-chat.html)
- [Spring AI ChatClient](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
- [Spring AI prompt engineering](https://docs.spring.io/spring-ai/reference/api/chat/prompt-engineering-patterns.html)
- [Spring AI chat memory](https://docs.spring.io/spring-ai/reference/api/chat-memory.html)
- [Spring AI structured output](https://docs.spring.io/spring-ai/reference/api/structured-output.html)
- [Spring AI tool calling](https://docs.spring.io/spring-ai/reference/api/tools.html)

### Frontend va database

- [React Learn](https://react.dev/learn)
- [Vite getting started](https://vite.dev/guide/)
- [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [MySQL 8.4 manual](https://dev.mysql.com/doc/refman/8.4/en/)
- [Flyway documentation](https://documentation.red-gate.com/fd)

---

## 16. Eng muhim xulosa

AI engineering faqat prompt yozish emas. Ishlaydigan AI ilova quyidagi qismlardan tuziladi:

```text
Yaxshi model
+ aniq system prompt
+ deterministik backend faktlari
+ validation
+ context boshqaruvi
+ error handling
+ real savollar bilan eval
+ oddiy va tushunarli UI
```

Shu loyihada o'rgangan eng muhim saboq: model noto'g'ri gapirsa, darhol “promptni uzaytirish” yoki “foydalanuvchi boshqa tilda yozsin” demang. Avval muammoni qatlamlarga ajrating:

1. Provider ishlayaptimi?
2. Model use case va tilga mosmi?
3. Modelga aniq fakt berildimi?
4. Eski context javobni zaharlayaptimi?
5. Parametrlar to'g'rimi?
6. Natija real eval savollari bilan tekshirildimi?

Shu tartib sizga keyingi AI loyihalarni ham tezroq va to'g'ri qurishga yordam beradi.
