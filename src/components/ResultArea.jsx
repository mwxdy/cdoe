import React from 'react';
import { Card } from 'antd';

const ResultArea = ({ content, loading }) => {
  return (
    <Card
      title="生成结果"
      loading={loading}
      style={{
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        background: '#ffffff'
      }}
      bodyStyle={{
        padding: '24px',
        minHeight: 200
      }}
      headStyle={{
        borderBottom: '1px solid #f0f0f0',
        padding: '16px 24px',
        fontSize: '16px',
        fontWeight: 500
      }}
    >
      {content ? (
        <div
          style={{
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#1f1f1f'
          }}
        >
          {content}
        </div>
      ) : (
        <div
          style={{
            color: '#999',
            textAlign: 'center',
            fontSize: '14px',
            paddingTop: '60px'
          }}
        >
          生成的内容将显示在这里
        </div>
      )}
    </Card>
  );
};

export default ResultArea;