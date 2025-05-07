import { Layout } from 'antd';

function TitleBar() {
  return (
    <Layout.Header
      style={{
        width: '100%',
        height: 30,
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        appRegion: 'drag',
      }}
    >
      Cool titlebar
    </Layout.Header>
  );
}

export default TitleBar;
