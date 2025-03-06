import React from 'react';
import { Input } from 'antd';

const { TextArea } = Input;

const InputArea = ({ value, onChange }) => {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ marginBottom: 8 }}>输入命令</div>
      <TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="请输入您的自定义命令..."
        autoSize={{ minRows: 4, maxRows: 6 }}
      />
    </div>
  );
};

export default InputArea;