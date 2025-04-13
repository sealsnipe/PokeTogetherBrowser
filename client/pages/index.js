import dynamic from 'next/dynamic';
import styles from '../styles/Home.module.css';

const Game = dynamic(() => import('../components/Game'), { ssr: false });

export default function Home() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Multiplayer Sandbox</h1>
      <Game />
    </div>
  );
}