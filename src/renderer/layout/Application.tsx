import TitleBar from '@/layout/TitleBar';
import { HomeOutlined, RestOutlined } from '@ant-design/icons';
import { Layout, Menu } from 'antd';
import { Link, useRoutes } from 'react-router-dom';

function Application() {
  const routerElements = useRoutes([
    {
      path: '/',
    },
  ]);

  if (!routerElements) {
    return null;
  }

  return (
    <Layout
      style={{
        height: '100vh',
        width: '100%',
      }}
    >
      <TitleBar />
      <Layout>
        <Layout.Sider>
          <Menu
            theme="dark"
            items={[
              {
                label: <Link to="/">Home</Link>,
                key: '/',
                icon: <HomeOutlined />,
              },
              {
                label: <Link to="/farm">Farm</Link>,
                key: '/farm',
                icon: <RestOutlined />,
              },
            ]}
          />
        </Layout.Sider>
        <Layout.Content>{routerElements}</Layout.Content>
      </Layout>
    </Layout>
  );
}

export default Application;
