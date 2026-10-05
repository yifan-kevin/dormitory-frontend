<template>
  <!-- LOCATE: 个人信息页面，头像和资料维护 -->
  <div class="page-shell selfinfo-page">
    <el-breadcrumb separator-icon="ArrowRight">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>个人信息</el-breadcrumb-item>
    </el-breadcrumb>

    <section class="glass-card selfinfo-hero">
      <div>
        <div class="page-eyebrow">My Profile</div>
        <h1 class="page-title">个人信息</h1>
        <p class="page-subtitle">查看和管理您的个人资料信息。</p>
      </div>
      <div class="profile-topbar__right">
        <div class="avatar-section">
          <el-upload :on-success="uploadSuccess" :show-file-list="false"
                     action="/api/files/upload"
                     :disabled="!canEditProfile"
                     class="upload-demo">
            <div class="avatar-wrap">
              <el-avatar icon="UserFilled" :size="96" />
              <img :src="'data:image;base64,' + image" :style="imgDisplay"
                   class="avatar-img" />
              <div v-if="canEditProfile" class="avatar-overlay">
                <el-icon :size="18"><Edit /></el-icon>
                <span>更换头像</span>
              </div>
            </div>
          </el-upload>
          <div class="avatar-name">
            <h2>{{ name }}</h2>
            <span>@{{ username }}</span>
          </div>
        </div>
        <el-button v-if="canEditProfile" type="primary" size="large" @click="Edit">
          <el-icon><Edit /></el-icon>
          修改信息
        </el-button>
      </div>
    </section>

    <section class="selfinfo-layout">
      <el-card class="section-card profile-card">
        <div class="avatar-section">
          <el-upload :on-success="uploadSuccess" :show-file-list="false"
                     action="/api/files/upload"
                     :disabled="!canEditProfile"
                     class="upload-demo">
            <div class="avatar-wrap">
              <el-avatar icon="UserFilled" :size="96" />
              <img :src="'data:image;base64,' + image" :style="imgDisplay"
                   class="avatar-img" />
              <div v-if="canEditProfile" class="avatar-overlay">
                <el-icon :size="18"><Edit /></el-icon>
                <span>更换头像</span>
              </div>
            </div>
          </el-upload>
          <div class="avatar-name">
            <h2>{{ name }}</h2>
            <span>@{{ username }}</span>
          </div>
        </div>

        <el-descriptions :column="1" border>
          <el-descriptions-item>
            <template #label>
              <div class="desc-label">
                <el-icon><User /></el-icon>
                用户名
              </div>
            </template>
            {{ username }}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <div class="desc-label">
                <el-icon><User /></el-icon>
                姓名
              </div>
            </template>
            {{ name }}
          </el-descriptions-item>
          <el-descriptions-item v-if="identity === 'stu'">
            <template #label>
              <div class="desc-label">
                <el-icon><OfficeBuilding /></el-icon>
                院系
              </div>
            </template>
            {{ department || "-" }}
          </el-descriptions-item>
          <el-descriptions-item v-if="identity === 'stu'">
            <template #label>
              <div class="desc-label">
                <el-icon><Tickets /></el-icon>
                班级
              </div>
            </template>
            {{ className || "-" }}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <div class="desc-label">
                <el-icon><Tickets /></el-icon>
                性别
              </div>
            </template>
            {{ gender }}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <div class="desc-label">
                <el-icon><OfficeBuilding /></el-icon>
                年龄
              </div>
            </template>
            {{ age }}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <div class="desc-label">
                <el-icon><Iphone /></el-icon>
                手机号
              </div>
            </template>
            {{ phone }}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <div class="desc-label">
                <el-icon><Message /></el-icon>
                邮箱
              </div>
            </template>
            {{ email }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="profile-actions">
          <el-button v-if="canEditProfile" type="primary" size="large" @click="Edit">
            <el-icon><Edit /></el-icon>
            修改信息
          </el-button>
        </div>
      </el-card>

      <div class="selfinfo-aside">
        <img alt="宿舍公共学习区" src="/images/common-study-area.jpg" class="selfinfo-illustration" />
      </div>
    </section>

    <el-dialog v-model="dialogVisible" title="修改个人信息" width="560px" @close="cancel">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px" class="modern-form">
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" disabled />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <div class="password-row">
            <el-input v-model="form.password" :disabled="disabled" :show-password="showpassword" show-password />
            <el-tooltip content="修改密码" placement="right">
              <el-button circle @click="EditPass">
                <el-icon><Edit /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </el-form-item>
        <el-form-item :style="display" label="确认密码" prop="checkPass">
          <el-input v-model="form.checkPass" show-password />
        </el-form-item>
        <div class="form-grid">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="form.name" />
          </el-form-item>
          <el-form-item v-if="identity === 'stu'" label="院系" prop="department">
            <el-input v-model.trim="form.department" placeholder="例如：计算机学院" />
          </el-form-item>
          <el-form-item v-if="identity === 'stu'" label="班级" prop="className">
            <el-input v-model.trim="form.className" placeholder="例如：软件工程2242" />
          </el-form-item>
          <el-form-item label="性别" prop="gender">
            <el-radio-group v-model="form.gender">
              <el-radio label="男">男</el-radio>
              <el-radio label="女">女</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="年龄" prop="age">
            <el-input v-model.number="form.age" />
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" />
          </el-form-item>
        </div>
        <el-form-item label="邮箱地址" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancel">取消</el-button>
          <el-button type="primary" @click="save">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script src="@/assets/js/SelfInfo.js"></script>

<style scoped>
.selfinfo-page {
  gap: 18px;
}

.selfinfo-hero {
  padding: 28px;
}

.profile-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.profile-topbar__right {
  display: none;
  align-items: center;
  gap: 22px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.profile-topbar .avatar-section {
  margin-bottom: 0;
}

.selfinfo-layout {
  display: grid;
  grid-template-columns: minmax(400px, 1.15fr) minmax(0, 0.85fr);
  gap: 18px;
  align-items: start;
}

.profile-card {
  overflow: visible;
}

.profile-card > .avatar-section,
.profile-card > .profile-actions {
  display: flex;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;
}

.upload-demo {
  width: 96px;
  height: 96px;
}

.avatar-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
}

.avatar-wrap .el-avatar {
  width: 96px !important;
  height: 96px !important;
}

.avatar-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 12px;
  border-radius: 50%;
}

.avatar-wrap:hover .avatar-overlay {
  display: flex;
}

.avatar-name h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.avatar-name span {
  display: block;
  margin-top: 4px;
  color: var(--text-color-muted);
  font-size: 14px;
}

.desc-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.profile-actions {
  display: flex;
  margin-top: 24px;
}

.selfinfo-aside {
  display: flex;
  align-items: center;
  justify-content: center;
}

.selfinfo-aside--top {
  min-height: 180px;
  padding: 18px 24px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--surface-soft);
}

.selfinfo-illustration {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.modern-form {
  padding-top: 8px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}

.password-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  width: 100%;
}

@media (max-width: 1200px) {
  .selfinfo-layout {
    grid-template-columns: 1fr;
  }

  .selfinfo-aside {
    order: -1;
  }
}

@media (max-width: 768px) {
  .selfinfo-hero {
    padding: 20px;
  }

  .profile-topbar,
  .profile-topbar__right {
    align-items: flex-start;
    flex-direction: column;
  }

  .avatar-section {
    flex-direction: column;
    text-align: center;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
