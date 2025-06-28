import TitleBar from '@/layout/TitleBar';
import { applicationRoutes } from '@/routes/application';
import { type MenuProps, Layout, Menu } from 'antd';
import { createStyles } from 'antd-style';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useRoutes } from 'react-router-dom';

const useStyles = createStyles(() => ({
  container: {
    height: '100vh',
    width: '100%',
  },
}));

function Application() {
  const { styles } = useStyles();
  const routerElements = useRoutes(applicationRoutes);
  const { t } = useTranslation();

  const location = useLocation();

  const menuItems = useMemo<MenuProps['items']>(() => {
    return applicationRoutes.reduce<Required<MenuProps>['items']>(
      (acc, item) => {
        if (item.path && item.label) {
          acc.push({
            key: item.path,
            icon: item.icon,
            label: <Link to={item.path}>{t(item.label)}</Link>,
          });
        }
        return acc;
      },
      [],
    );
  }, [t]);

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
            items={menuItems}
            selectedKeys={[location.pathname]}
          />
        </Layout.Sider>
        <Layout.Content>{routerElements}</Layout.Content>
      </Layout>
    </Layout>
  );
}

export default Application;
