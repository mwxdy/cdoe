import React from 'react';
import { Card, Select, InputNumber } from 'antd';

const QuickGenPanel = ({ onSettingsChange }) => {
  const [settings, setSettings] = React.useState({
    style: 'cream',
    count: 1
  });

  // 定义样式映射对象
  const STYLE_MAP = {
    'cream': '奶油风',
    'minimal': '简约风',
    'nordic': '北欧风'
  };

  const handleStyleChange = (value) => {
    onSettingsChange({ style: value, command: `生成${settings.count || 1}篇${STYLE_MAP[value]}的文章` });
  };

  const handleCountChange = (value) => {
    onSettingsChange({ count: value, command: `生成${value}篇${STYLE_MAP[settings.style]}的文章` });
  };

  React.useEffect(() => {
    handleStyleChange('cream');
  }, []);

  return (
    <Card
      title="快速生成设置"
      style={{
        marginBottom: 24,
        borderRadius: 12,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        background: '#ffffff'
      }}
      bodyStyle={{ padding: '24px' }}
      headStyle={{
        borderBottom: '1px solid #f0f0f0',
        padding: '16px 24px',
        fontSize: '16px',
        fontWeight: 500
      }}
    >
      <div className="quick-gen-panel-content">
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 8, fontSize: '14px', color: '#1f1f1f' }}>文章风格</div>
          <Select
            style={{ width: '100%' }}
            placeholder="选择文章风格"
            defaultValue="cream"
            onChange={(value) => {
              setSettings(prev => {
                const newSettings = { ...prev, style: value };
                handleStyleChange(value);
                return newSettings;
              });
            }}
            options={[
              { value: 'cream', label: '奶油风' },
              { value: 'minimal', label: '简约风' },
              { value: 'nordic', label: '北欧风' },
            ]}
          />
        </div>
        <div style={{ width: 120 }}>
          <div style={{ marginBottom: 8, fontSize: '14px', color: '#1f1f1f' }}>文章数量</div>
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            max={10}
            defaultValue={1}
            onChange={(value) => {
              setSettings(prev => {
                const newSettings = { ...prev, count: value };
                handleCountChange(value);
                return newSettings;
              });
            }}
          />
        </div>
      </div>
    </Card>
  );
};

export default QuickGenPanel;