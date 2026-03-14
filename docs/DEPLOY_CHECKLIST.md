# 배포 준비 점검

## 0. 환경 변수 (선택 – 랜딩 배경 영상)

`.env.local`에 다음을 넣으면 랜딩 페이지 배경이 영상으로 표시됩니다. 없으면 평온한 자연 이미지 플레이스홀더가 사용됩니다.

```bash
# 랜딩 배경 영상 (Supabase Storage 등 외부 URL 가능)
NEXT_PUBLIC_LANDING_BACKGROUND_VIDEO_URL=https://your-project.supabase.co/storage/v1/object/public/.../aeterna-background.mp4

# 영상 로딩 중·모바일용 미리보기 이미지 (선택, 기본: Unsplash 평온한 자연 이미지)
NEXT_PUBLIC_LANDING_BACKGROUND_POSTER_URL=https://...
```

- 영상 URL만 설정해 두면, Supabase Storage에 업로드한 뒤 위 URL만 붙여넣어 바로 반영됩니다.
- `POSTER_URL`은 미설정 시 기본 플레이스홀더 이미지가 사용됩니다.

## 1. 점검 실행

```bash
node scripts/verify-deploy.mjs
```

- **events 테이블**: `preview_film_url`, `full_film_requested_at` 컬럼 존재 여부 확인
- **Storage(photos)**: `previews/` 경로에 대한 업로드 가능 여부 확인 (service role 기준)

## 2. DB 마이그레이션 (컬럼 없을 때)

### 방법 A: Supabase Dashboard (권장)

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택
2. **SQL Editor** → New query
3. `supabase-add-preview-and-full-film.sql` 파일 내용 전체 붙여넣기 후 **Run**

### 방법 B: psql (DATABASE_URL 있을 때)

Supabase **Project Settings → Database** 에서 Connection string 복사 후:

```bash
# .env.local에 추가 (선택)
# DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres

source .env.local  # 또는 export DATABASE_URL=...
node scripts/verify-deploy.mjs   # 스크립트가 psql로 마이그레이션 자동 실행 시도
```

## 3. Storage (photos 버킷) – previews/ 업로드

- **현재 구조**: 프리뷰 영상은 **서버(Server Action)** 에서만 업로드하며, `SUPABASE_SERVICE_ROLE_KEY`를 사용합니다. Service role은 RLS를 거치지 않으므로, **별도 Storage 정책 없이** `photos` 버킷에 `previews/` 업로드가 가능합니다.
- 점검 스크립트는 `previews/`에 테스트 파일 업로드 후 삭제하여, 이 경로가 정상인지 확인합니다.

### (선택) 익명/인증 사용자 직접 업로드가 필요할 때

나중에 클라이언트에서 직접 `previews/`로 업로드하도록 바꾸는 경우, Supabase Dashboard → **Storage → photos → Policies** 에서 예시:

- **Policy name**: `Allow uploads to previews folder`
- **Allowed operation**: INSERT
- **Target**: `previews/*`
- **Policy**: `true` (또는 `auth.role() = 'authenticated'` 등 필요에 맞게 설정)

현재는 서버만 업로드하므로 위 정책은 필수가 아닙니다.

## 4. 점검 통과 후

스크립트가 다음을 출력하면 배포 준비가 완료된 상태입니다.

```
✅ events 테이블: preview_film_url, full_film_requested_at 컬럼 존재
✅ Storage(photos 버킷): previews/ 경로 업로드 가능 (service role)

🎉 배포 준비 완료
```
