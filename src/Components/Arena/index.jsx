import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import myEpicGame from '../../utils/MyEpicGame.json';
import './Arena.css';
import LoadingIndicator from "../../Components/LoadingIndicator";

/*
 * We pass in our characterNFT metadata so we can show a cool card in our UI
 */
const Arena = ({ characterNFT, setCharacterNFT }) => {
  // State
  const [gameContract, setGameContract] = useState(null);
  //State that will hold our boss metadata
  const [boss, setBoss] = useState(null);
  const [attackState, setAttackState] = useState('');//setAttackState estamos usando esto para agregar algunas animaciones
                                                    // durante nuestras jugadas de ataque.
  const [showToast, setShowToast] = useState(false);
  
  const runAttackAction = async () => {
    try { 
      if (gameContract) { 
        setAttackState('attacking'); //attacking- Cuando estamos esperando que termine la transacción
        console.log('Attacking boss...');
        const attackTxn = await gameContract.attackBoss();
        await attackTxn.wait();//attackTxn.wait() => decirle a nuestra interfaz de usuario que no haga nada hasta que 
                               //nuestra transacción haya sido minada
        console.log('attackTxn', attackTxn);
        setAttackState('hit'); //hit- Cuando le damos un golpe a nuestro jefe

        //Set your toast state to true and then false 5 seconds later
        setShowToast(true);
        setTimeOut(() => {
          setShowToast(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Error attacking boss:', error);
      setAttackState(''); //''- Estado predeterminado donde no queremos que suceda nada
    }
  };
  
  // UseEffects
  useEffect(() => {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicGame.abi,
        signer
      );

      setGameContract(gameContract);
    } else {
      console.log('Ethereum object not found');
    }
  }, []);

  useEffect(() => {
    const fetchBoss = async () => {
      const bossTxn = await gameContract.getBigBoss();
      console.log('Boss', bossTxn);
      setBoss(transformCharacterData(bossTxn));
    }
    //Setup logic when this event is fired off
  const onAttackComplete = (newBossHp, newPlayerHp) => {
    const bossHp = newBossHp.toNumber();
    const playerHp = newPlayerHp.toNumber();
    console.log(`AttackComplete: Boss Hp: ${bossHp} Player Hp: ${playerHp}`);
    
    //Update both player and boss Hp
    //newBossHpy y newPlayerHp lo usaremos para actualizar el estado de nuestro jefe y nuestro personaje NFT
    //En React, useStatenos permite obtener el valor de estado anterior antes de establecer uno nuevo!
    setBoss((prevState) => {
      return { ...prevState, hp:bossHp };
    });
    setCharacterNFT((prevState) => {
      return { ...prevState, hp:playerHp };
    });
  }
    
    if (gameContract) {
      fetchBoss();
      gameContract.on('AttackComplete', onAttackComplete);
    };
    
    // Make sure to clean up this event when this component is removed
    return () => {
      if (gameContract) {
        gameContract.off('AttackComplete', onAttackComplete)
      }
    }
  },[gameContract]);

  return (
  <div className="arena-container">
    {/* Add your toast HTML right here */}
    {boss && characterNFT && (
    <div id="toast" className={showToast ? 'show' : ''}>
      <div id="desc">{`🧨 ${boss.name} was hit for ${characterNFT.attackDamage}!`}</div>
    </div>
    )}

    
    {/* Boss */}
    {boss && (
      <div className="boss-container">
        <div className={`boss-content ${attackState}`}>
          <h2>🔥 {boss.name} 🔥</h2>
          <div className="image-content">
            <img src={boss.imageURI} alt={`Boss ${boss.name}`} />
            <div className="health-bar">
              <progress value={boss.hp} max={boss.maxHp} />
              <p>{`${boss.hp} / ${boss.maxHp} HP`}</p>
            </div>
          </div>
        </div>
        <div className="attack-container">
          <button className="cta-button" onClick={runAttackAction}>
            {`💥 Attack ${boss.name}`}
          </button>
        </div>
        {attackState === 'attacking' && (
        <div className="loading-indicator">
          <LoadingIndicator />
          <p>Attacking 🚀</p>
        </div>
        )}
      </div>
    )}

    
      {/* Replace your Character UI with this */}
    {characterNFT && (
      <div className="players-container">
        <div className="player-container">
          <h2>Your Character</h2>
          <div className="player">
            <div className="image-content">
              <h2>{characterNFT.name}</h2>
              <img
                src={characterNFT.imageURI}
                alt={`Character ${characterNFT.name}`}
              />
              <div className="health-bar">
                <progress value={characterNFT.hp} max={characterNFT.maxHp} />
                <p>{`${characterNFT.hp} / ${characterNFT.maxHp} HP`}</p>
              </div>
            </div>
            <div className="stats">
              <h4>{`💣 Attack Damage: ${characterNFT.attackDamage}`}</h4>
            </div>
          </div>
        </div>
         {/* <div className="active-players">
          <h2>Active Players</h2>
          <div className="players-list">{renderActivePlayersList()}</div>
        </div> */}
      </div>
    )}
  </div>
);
};

export default Arena;