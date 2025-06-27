import TitleBar from '@/layout/TitleBar';
import { applicationRoutes } from '@/routes/application';
import { HomeOutlined, RestOutlined } from '@ant-design/icons';
import { Layout, Menu } from 'antd';
import { createStyles } from 'antd-style';
import { Link, useRoutes } from 'react-router-dom';

const useStyles = createStyles(() => ({
  container: {
    height: '100vh',
    width: '100%',
  },
}));

function Application() {
  const { styles } = useStyles();
  const routerElements = useRoutes(applicationRoutes);

  if (!routerElements) {
    return null;
  }

  return (
    <Layout className={styles.container}>
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
