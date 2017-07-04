import React from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

import SPECS from 'common/SPECS';
import SpellLink from 'common/SpellLink';
import Icon from 'common/Icon';

import { formatNumber, formatPercentage, formatDuration } from 'common/format';

class HealEventTracker extends React.Component {
  static propTypes = {
    parser: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      maxPlayerHealthPercentage: 0.35,
      minHealOfMaxHealthPercentage: 0.1,
    };
  }

  componentDidUpdate() {
    ReactTooltip.rebuild();
  }

  render() {
    const { parser } = this.props;
    const events = parser.modules.healEventTracker.events;
    const players = parser.combatants.players;
    const fightStart = parser.fight.start_time;

    let total = 0;
    let count = 0;
    let totalBigHealing = 0;
    let bigHealCount = 0;

    const sliderProps = {
      min: 0,
      max: 1,
      step: 0.05,
      marks: {
        0: '0%',
        0.1: '10%',
        0.2: '20%',
        0.3: '30%',
        0.4: '40%',
        0.5: '50%',
        0.6: '60%',
        0.7: '70%',
        0.8: '80%',
        0.9: '90%',
        1: '100%',
      },
      style: { marginBottom: '2em' },
    };

    return (
      <div>
        <div className="panel-heading">
          <h2>Low health healing</h2>
        </div>
        <div>
          <div style={{ padding: 15 }}>
            Max health of target: <Slider
              {...sliderProps}
              defaultValue={this.state.maxPlayerHealthPercentage}
              onChange={(value) => {
                this.setState({
                  maxPlayerHealthPercentage: value,
                });
              }}
            /><br />
            Min effective healing (percentage of target's health): <Slider
              {...sliderProps}
              defaultValue={this.state.minHealOfMaxHealthPercentage}
              onChange={(value) => {
                this.setState({
                  minHealOfMaxHealthPercentage: value,
                });
              }}
            />
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Ability</th>
                <th>Target</th>
                <th colSpan="2">Player health before heal</th>
                <th colSpan="2">Healing done (percentage of max health)</th>
              </tr>
            </thead>
            <tbody>
              {
                events
                  .map(event => {
                    const effectiveHealing = event.amount + (event.absorbed || 0);
                    const hitPointsBeforeHeal = event.hitPoints - effectiveHealing;

                    if ((hitPointsBeforeHeal / event.maxHitPoints) > this.state.maxPlayerHealthPercentage) {
                      return false;
                    }
                    total += effectiveHealing;
                    count += 1;
                    if ((effectiveHealing / event.maxHitPoints) < this.state.minHealOfMaxHealthPercentage) {
                      return false;
                    }
                    bigHealCount += 1;
                    totalBigHealing += effectiveHealing;

                    const combatant = players[event.targetID];
                    const spec = SPECS[combatant.specId];
                    const specClassName = spec.className.replace(' ', '');

                    return (
                      <tr key={`${event.timestamp}${effectiveHealing}${hitPointsBeforeHeal}`}>
                        <td style={{ width: '5%'}}>
                          {formatDuration((event.timestamp - fightStart) / 1000)}
                        </td>
                        <td style={{ width: '25%' }}>
                          <SpellLink id={event.ability.guid}>
                            <Icon icon={event.ability.abilityIcon} alt={event.ability.abilityIcon} /> {event.ability.name}
                          </SpellLink>
                        </td>
                        <td style={{ width: '15%' }} className={specClassName}>
                          <img src={`/specs/${specClassName}-${spec.specName.replace(' ', '')}.jpg`} alt="Spec logo" />{' '}
                          {combatant.name}
                        </td>
                        <td style={{ width: 50, paddingRight: 5, textAlign: 'right' }}>
                          <dfn data-tip={formatNumber(hitPointsBeforeHeal)}>
                            {(formatPercentage(hitPointsBeforeHeal / event.maxHitPoints))}%
                          </dfn>
                        </td>
                        <td style={{ width: '25%' }}>
                          <div
                            className={`performance-bar ${specClassName}-bg`}
                            style={{ width: `${Math.min(100, hitPointsBeforeHeal / event.maxHitPoints * 100)}%` }}
                          />
                        </td>
                        <td style={{ width: 50, paddingRight: 5, textAlign: 'right' }}>
                          <dfn data-tip={formatNumber(effectiveHealing)}>
                            {(formatPercentage(effectiveHealing / event.maxHitPoints))}%
                          </dfn>
                        </td>
                        <td style={{ width: '25%' }}>
                          <div
                            className={`performance-bar Hunter-bg`}
                            style={{ width: `${Math.min(100, effectiveHealing / event.maxHitPoints * 100)}%` }}
                          />
                        </td>
                      </tr>
                    );
                  })
              }
              <tr>
                <td colSpan="7">
                  Total healing done on targets below {(this.state.maxPlayerHealthPercentage * 100)}% health: {formatNumber(total)} (spread over {count} seperate heals).<br />
                  Total healing done on targets below {(this.state.maxPlayerHealthPercentage * 100)}% health for more than {Math.round(this.state.minHealOfMaxHealthPercentage * 100)}% of target's max health: {formatNumber(totalBigHealing)} (spread over {bigHealCount} seperate heals).
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default HealEventTracker;