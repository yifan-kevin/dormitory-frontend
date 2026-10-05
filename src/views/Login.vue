<template>
  <div class="login-page" :lang="currentLanguage === 'en' ? 'en' : 'zh-CN'">
    <main class="login-shell">
      <section class="login-intro" :aria-label="copy.introLabel">
        <div class="campus-brand">
          <span class="campus-brand__mark" aria-hidden="true"><el-icon><House /></el-icon></span>
          <span>{{ copy.brand }}</span>
        </div>
        <div class="intro-copy">
          <h2>{{ copy.introTitle }}</h2>
          <p>{{ copy.introDescription }}</p>
        </div>
        <figure class="campus-photo">
          <img src="/images/campus-courtyard.jpg" :alt="copy.photoAlt" />
          <figcaption>{{ copy.photoCaption }}</figcaption>
        </figure>
        <p class="intro-note"><span aria-hidden="true" class="intro-note__line"></span>{{ copy.introNote }}</p>
      </section>

      <section class="login-card" aria-labelledby="login-title">
        <div class="login-header">
          <p class="login-eyebrow">{{ copy.subtitle }}</p>
          <h1 id="login-title">{{ copy.title }}</h1>
          <p class="login-description">{{ copy.loginDescription }}</p>
        </div>

        <el-form ref="form" :model="form" :rules="formRules" :validate-on-rule-change="false" class="login-form" @submit.prevent="login">
          <el-form-item prop="username">
            <label class="field-label" for="login-username">{{ copy.usernameLabel }}</label>
            <div class="field-shell" :class="{ active: focusedInput === 'username' }">
              <el-input
                id="login-username"
                v-model="form.username"
                name="username"
                autocomplete="username"
                clearable
                :placeholder="copy.usernamePlaceholder"
                @focus="onInputFocus('username')"
                @blur="onInputBlur"
              >
                <template #prefix><el-icon><User /></el-icon></template>
              </el-input>
            </div>
          </el-form-item>

          <el-form-item prop="password">
            <label class="field-label" for="login-password">{{ copy.passwordLabel }}</label>
            <div class="field-shell" :class="{ active: focusedInput === 'password' }">
              <el-input
                id="login-password"
                v-model="form.password"
                name="password"
                autocomplete="current-password"
                show-password
                :placeholder="copy.passwordPlaceholder"
                @focus="onInputFocus('password')"
                @blur="onInputBlur"
              >
                <template #prefix><el-icon><Lock /></el-icon></template>
              </el-input>
            </div>
          </el-form-item>

          <el-form-item prop="identity" class="role-form-item">
            <fieldset class="role-section">
              <legend class="field-label">{{ copy.identityLabel }}</legend>
              <div class="role-grid">
                <label class="role-option" :class="{ active: form.identity === 'stu' }">
                  <input v-model="form.identity" type="radio" name="login-identity" value="stu" />
                  <span class="role-option__label">{{ copy.student }}</span>
                </label>
                <label class="role-option" :class="{ active: form.identity === 'dormManager' }">
                  <input v-model="form.identity" type="radio" name="login-identity" value="dormManager" />
                  <span class="role-option__label">{{ copy.dormManager }}</span>
                </label>
                <label class="role-option" :class="{ active: form.identity === 'worker' }">
                  <input v-model="form.identity" type="radio" name="login-identity" value="worker" />
                  <span class="role-option__label">{{ copy.worker }}</span>
                </label>
                <label class="role-option" :class="{ active: form.identity === 'admin' }">
                  <input v-model="form.identity" type="radio" name="login-identity" value="admin" />
                  <span class="role-option__label">{{ copy.admin }}</span>
                </label>
              </div>
            </fieldset>
          </el-form-item>

          <div class="login-tools">
            <label class="remember-toggle">
              <input type="checkbox" :checked="rememberPassword" @change="toggleRememberPassword" />
              <span>{{ copy.rememberPassword }}</span>
            </label>
            <button type="button" class="login-link" @click="showForgotPasswordTips">{{ copy.forgotPassword }}</button>
          </div>

          <el-form-item class="login-action">
            <el-button
              :disabled="!disabled || loginLoading"
              type="primary"
              native-type="submit"
              class="login-button"
              :loading="loginLoading"
            >
              <span>{{ loginLoading ? copy.loggingIn : copy.login }}</span>
              <el-icon v-if="!loginLoading" aria-hidden="true"><ArrowRight /></el-icon>
            </el-button>
          </el-form-item>

          <div class="login-meta">
            <span>{{ copy.helpNote }}</span>
            <div class="login-language" :aria-label="copy.languageLabel">
              <button type="button" :aria-pressed="currentLanguage === 'zh'" :class="{ active: currentLanguage === 'zh' }" @click="switchLanguage('zh')">中文</button>
              <span aria-hidden="true">/</span>
              <button type="button" :aria-pressed="currentLanguage === 'en'" :class="{ active: currentLanguage === 'en' }" @click="switchLanguage('en')">English</button>
            </div>
          </div>
        </el-form>
      </section>
    </main>
  </div>
</template>

<script src="@/assets/js/Login.js"></script>

<style scoped>
.login-page {
  --login-forest: #183c30;
  --login-forest-deep: #102c23;
  --login-gold: #baa375;
  --login-paper: #fdfcf8;
  height: 100vh;
  height: 100dvh;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 48px 28px;
  background: #efeee8;
  color: #26392f;
}

.login-shell {
  display: grid;
  grid-template-columns: 1.08fr 1fr;
  width: 1120px;
  max-width: 100%;
  flex-shrink: 0;
  margin: auto;
  overflow: hidden;
  background: var(--login-paper);
  border: 1px solid #d7d9cf;
  border-radius: 14px;
  box-shadow: 0 24px 64px -36px rgba(28, 42, 30, 0.38), 0 3px 12px rgba(28, 42, 30, 0.035);
}

.login-intro {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--login-forest);
}

.campus-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 34px 42px 0;
  color: #e4e9dd;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.campus-brand__mark {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 35px;
  height: 35px;
  border: 1px solid rgba(186, 163, 117, 0.6);
  border-radius: 7px;
  color: #d5c497;
  font-size: 19px;
}

.intro-copy { padding: 35px 42px 29px; }
.intro-copy h2 {
  margin: 0 0 12px;
  color: #f3f0e5;
  font-family: "Songti SC", "STSong", "SimSun", serif;
  font-size: 31px;
  line-height: 1.65;
  font-weight: 500;
  letter-spacing: 0.055em;
}
.intro-copy p {
  max-width: 340px;
  margin: 0;
  color: #b5c5b9;
  font-size: 12px;
  line-height: 1.9;
}
.campus-photo { margin: 0; }
.campus-photo img {
  display: block;
  width: 100%;
  height: 285px;
  object-fit: cover;
  object-position: 46% center;
}
.campus-photo figcaption {
  padding: 16px 42px;
  color: #c4bfaa;
  font-size: 11px;
  line-height: 1.6;
  letter-spacing: 0.04em;
}
.intro-note {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: auto 0 0;
  padding: 19px 42px 31px;
  color: #a6baab;
  font-size: 11px;
  line-height: 1.8;
}
.intro-note__line {
  flex-shrink: 0;
  width: 22px;
  height: 1px;
  margin-top: 10px;
  background: var(--login-gold);
}

.login-card { min-width: 0; padding: 49px 48px 35px; }
.login-header { margin-bottom: 29px; }
.login-eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 14px;
  color: #8f8268;
  font-size: 11px;
  line-height: 1.7;
  letter-spacing: 0.04em;
}
.login-eyebrow::before { content: ""; width: 18px; height: 1px; flex-shrink: 0; background: #bba67c; }
.login-header h1 { margin: 0; color: #1c382b; font-size: 30px; font-weight: 600; line-height: 1.5; letter-spacing: 0.035em; }
.login-description { margin: 11px 0 0; color: #839083; font-size: 12px; line-height: 1.7; }
.login-form :deep(.el-form-item) { margin-bottom: 21px; }
.login-form :deep(.el-form-item__content) { display: block; line-height: normal; }
.field-label { display: block; margin-bottom: 9px; color: #4b5c50; font-size: 12px; line-height: 1.6; font-weight: 500; }
.field-shell { width: 100%; }
.field-shell :deep(.el-input__inner) {
  height: 48px;
  border: 1px solid #d8ddd1 !important;
  border-radius: 7px !important;
  background: #f9faf5 !important;
  color: #26392f !important;
  caret-color: var(--login-forest);
  font-size: 14px;
  transition: border-color 0.15s, background-color 0.15s;
}
.field-shell :deep(.el-input--prefix .el-input__inner) { padding-left: 40px; }
.field-shell :deep(.el-input__inner::placeholder) { color: #a0a89a !important; -webkit-text-fill-color: #a0a89a !important; }
.field-shell :deep(.el-input__inner:focus),
.field-shell.active :deep(.el-input__inner) {
  border-color: #527463 !important;
  background: #fff !important;
  box-shadow: 0 0 0 3px rgba(39, 80, 58, 0.06) !important;
}
.field-shell :deep(.el-input__prefix),
.field-shell :deep(.el-input__suffix) { display: inline-flex; align-items: center; color: #85947f; }
.field-shell :deep(.el-input__prefix) { left: 14px; }
.field-shell :deep(.el-input__prefix .el-icon) { font-size: 16px; }
.field-shell :deep(.el-input__wrapper) { min-height: 48px; padding: 0 14px; border: 1px solid #d8ddd1 !important; border-radius: 7px !important; background: #f9faf5 !important; box-shadow: none !important; }
.field-shell.active :deep(.el-input__wrapper) { border-color: #527463 !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(39, 80, 58, 0.06) !important; }
.field-shell :deep(.el-input__wrapper .el-input__inner) { height: 46px; padding-left: 0; border: 0 !important; background: transparent !important; box-shadow: none !important; }
.role-section { width: 100%; min-width: 0; margin: 0; padding: 0; border: 0; }
.role-section legend { padding: 0; }
.role-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.role-option {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 45px;
  padding: 11px 13px;
  border: 1px solid #dfe3d8;
  border-radius: 7px;
  background: #fdfdf9;
  cursor: pointer;
  color: #72816e;
  font-size: 12px;
  line-height: 1.5;
  transition: border-color 0.15s, background-color 0.15s;
}
.role-option:hover { border-color: #aebcaa; background: #f6f8f1; }
.role-option.active { border-color: #557361; background: #eff4ec; color: #254c36; }
.role-option__label { min-width: 0; }
.role-option input,
.remember-toggle input { flex-shrink: 0; width: 15px; height: 15px; margin: 0; accent-color: #214e37; cursor: pointer; }
.role-option:focus-within { outline: 2px solid #859d85; outline-offset: 2px; }
.login-tools { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin: 2px 0 24px; font-size: 11px; }
.remember-toggle { display: flex; align-items: center; gap: 8px; color: #75826e; cursor: pointer; }
.login-link,
.login-language button { padding: 0; border: 0; background: transparent; font: inherit; cursor: pointer; color: #84917a; }
.login-link { color: #4c684f; font-size: 11px; }
.login-link:hover,
.login-language button:hover { text-decoration: underline; }
.login-button {
  width: 100%;
  height: 49px;
  border: 1px solid var(--login-forest) !important;
  border-radius: 7px !important;
  background: var(--login-forest) !important;
  color: #f4f2e7 !important;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 6px 16px rgba(24, 60, 48, 0.09) !important;
}
.login-button :deep(> span) { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; }
.login-button :deep(.el-icon) { font-size: 15px; }
.login-button:hover,
.login-button:focus { background: var(--login-forest-deep) !important; border-color: var(--login-forest-deep) !important; }
.login-button.is-disabled,
.login-button.is-disabled:hover { background: #65836b !important; border-color: #65836b !important; box-shadow: none !important; opacity: 0.62; }
.login-form :deep(.login-action) { margin-bottom: 25px; }
.login-meta { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding-top: 19px; border-top: 1px solid #e4e5da; color: #8b9682; font-size: 10px; line-height: 1.7; }
.login-language { display: flex; align-items: center; gap: 7px; white-space: nowrap; }
.login-language button.active { color: #415d40; font-weight: 600; }
button:focus-visible,
input:focus-visible { outline: 2px solid #859d85; outline-offset: 3px; }
.login-page[lang="en"] .intro-copy h2 { letter-spacing: 0; font-size: 30px; line-height: 1.4; }
.login-page[lang="en"] .login-header h1 { letter-spacing: -0.01em; font-size: 28px; line-height: 1.35; }

@media (max-width: 1000px) {
  .login-page { padding: 30px 24px; }
  .campus-brand { padding: 32px 32px 0; }
  .intro-copy { padding: 30px 32px 26px; }
  .intro-copy h2 { font-size: 27px; }
  .campus-photo img { height: 285px; }
  .campus-photo figcaption { padding-left: 32px; padding-right: 32px; }
  .intro-note { padding-left: 32px; padding-right: 32px; }
  .login-card { padding: 43px 34px 32px; }
}

@media (max-width: 740px) {
  .login-page { padding: 24px 16px; align-items: flex-start; }
  .login-shell { grid-template-columns: 1fr; width: 100%; max-width: 440px; border-radius: 12px; }
  .campus-brand { padding: 19px 25px; font-size: 12px; }
  .campus-brand__mark { width: 31px; height: 31px; border-radius: 6px; font-size: 17px; }
  .intro-copy, .campus-photo, .intro-note { display: none; }
  .login-card { padding: 30px 27px 27px; }
  .login-header { margin-bottom: 27px; }
  .login-header h1 { font-size: 27px; }
  .login-eyebrow { margin-bottom: 11px; }
  .login-meta { row-gap: 10px; }
}

@media (max-width: 360px) {
  .login-page { padding: 14px 11px; }
  .campus-brand { padding: 17px 20px; }
  .login-card { padding: 27px 20px 24px; }
  .login-header h1 { font-size: 25px; }
  .login-page[lang="en"] .login-header h1 { font-size: 25px; }
  .role-option { padding: 11px 9px; gap: 7px; }
  .login-meta { font-size: 10px; }
}
</style>
