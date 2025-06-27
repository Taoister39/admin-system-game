import { Layout } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(() => ({
  header: {
    width: '100%',
    height: 30,
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    appRegion: 'drag',
  },
}));

function TitleBar() {
  const { styles } = useStyles();

  return <Layout.Header className={styles.header}>Cool titlebar</Layout.Header>;
}

export default TitleBar;
