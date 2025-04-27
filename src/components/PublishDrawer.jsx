import React, { useState } from 'react';
import { Drawer, Input, Select, Button, message, Collapse, Image } from 'antd';
import { generateArticle } from '../services/cozeApi_push';
import configGuide1 from '../assets/images/说明1.png';
import configGuide2 from '../assets/images/说明2.png';

const { Panel } = Collapse;

const PublishDrawer = ({ visible, onClose }) => {
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [style, setStyle] = useState('奶油风');
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    if (!appId || !appSecret) {
      message.error({
        content: '请填写完整的公众号配置信息',
        style: {
          marginTop: '80px',
          zIndex: 1050
        }
      });
      return;
    }
    setLoading(true);
    try {
      const response = await generateArticle(appId, appSecret, style);
      if (response.status === 'success') {
        message.success({
          content: '发布成功，可以进入"https://mp.weixin.qq.com/cgi-bin/appmsgpublish"查看',
          style: {
            marginTop: '80px',
            zIndex: 1050
          }
        });
        onClose();
      } else {
        message.error({
          content: response.content || '发布失败',
          style: {
            marginTop: '80px',
            zIndex: 1050
          }
        });
      }
    } catch (error) {
      console.error('发布失败:', error);
      message.error({
        content: '发布失败，请重试',
        style: {
          marginTop: '80px',
          zIndex: 1050
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title="一键发布到公众号"
      placement="right"
      width="50%"
      onClose={onClose}
      open={visible}
      zIndex={1000}
    >
      <div style={{ marginBottom: 16 }}>
        <div className="warning-text" style={{ color: '#ff4d4f', marginBottom: 16 }}>
          如果没有完成公众号的后台配置，请点击下方配置指引按钮，完成后台配置
        </div>
        <Collapse>
          <Panel header="配置指引" key="1">
            <div style={{ marginBottom: 16 }}>
              {/* TODO: 添加配置指引图片 */}
              <p>1. 登录公众号后台</p>
              <p>2. 进入开发接口管理</p>
              <p>3. 查看并复制自己的开发者ID(AppID)和开发者密码(AppSecret)，填入下方框内（开发者密码只出现一次，建议在记事本保存备份）</p>
              <p>4. 添加IP白名单:106.15.251.85</p>
              <Image
                src={configGuide1}
                alt="配置指引步骤1"
                style={{ marginBottom: 16, width: '100%' }}
              />
              <Image
                src={configGuide2}
                alt="配置指引步骤2"
                style={{ width: '100%' }}
              />
            </div>
          </Panel>
        </Collapse>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>AppID：</div>
        <Input
          value={appId}
          onChange={(e) => setAppId(e.target.value)}
          placeholder="请输入AppID"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>AppSecret：</div>
        <Input
          value={appSecret}
          onChange={(e) => setAppSecret(e.target.value)}
          placeholder="请输入AppSecret"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>选择风格：</div>
        <Select
          value={style}
          onChange={setStyle}
          style={{ width: '100%' }}
          options={[
            { value: '奶油风', label: '奶油风' },
            { value: '简约风', label: '简约风' },
            { value: '北欧风', label: '北欧风' },
          ]}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          width: 'calc(100% - 48px)',
          borderTop: '1px solid #e8e8e8',
          padding: '10px 24px',
          textAlign: 'right',
          left: 0,
          background: '#fff',
        }}
      >
        <Button onClick={onClose} style={{ marginRight: 8 }}>
          取消
        </Button>
        <Button onClick={handlePublish} type="primary" loading={loading}>
          发布
        </Button>
      </div>
    </Drawer>
  );
};

export default PublishDrawer;