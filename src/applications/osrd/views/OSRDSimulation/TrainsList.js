import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import nextId from 'react-id-generator';
import { useTranslation } from 'react-i18next';
import { sec2time } from 'utils/timeManipulation';
import { updateMustRedraw, updateSelectedTrain } from 'reducers/osrdsimulation';
import InputSNCF from 'common/BootstrapSNCF/InputSNCF';
import TrainListModal from 'applications/osrd/components/TrainList/TrainListModal';
import { IoMdEye } from 'react-icons/io';

export default function TrainsList(props) {
  const { toggleTrainList } = props;
  const {
    selectedTrain, simulation,
  } = useSelector((state) => state.osrdsimulation);
  const dispatch = useDispatch();
  const [formattedList, setFormattedList] = useState(undefined);
  const [filter, setFilter] = useState('');
  const [trainIDX, setTrainIDX] = useState(undefined);

  const { t } = useTranslation(['simulation']);

  const changeSelectedTrain = (idx) => {
    dispatch(updateMustRedraw(true));
    dispatch(updateSelectedTrain(idx));
  };

  const formatTrainsList = () => {
    const newFormattedList = simulation.trains.map((train, idx) => {
      if (filter === '' || (train.labels !== undefined && train.labels.join().toLowerCase().includes(filter.toLowerCase()))) {
        return (
          <tr
            className={selectedTrain === idx ? 'table-cell-selected' : null}
            key={nextId()}
          >
            <td>
              <div className="cell-inner">
                <div className="custom-control custom-checkbox custom-checkbox-alone">
                  <input type="checkbox" className="custom-control-input" id={`timetable-train-${idx}`} />
                  <label className="custom-control-label" htmlFor={`timetable-train-${idx}`} />
                </div>
              </div>
            </td>
            <td className="td-button">
              <div
                className="cell-inner cell-inner-button"
                role="button"
                onClick={() => changeSelectedTrain(idx)}
                tabIndex={0}
              >
                <InputSNCF
                  type="text"
                  id="trainlist-modal-name"
                  onChange={() => {}}
                  value={train.name}
                  noMargin
                  sm
                />
              </div>
            </td>
            <td>
              <div className="cell-inner">
                <InputSNCF
                  type="time"
                  id="trainlist-modal-name"
                  onChange={() => {}}
                  value={sec2time(train.stops[0].time)}
                  noMargin
                  sm
                />

              </div>
            </td>
            <td><div className="cell-inner">{sec2time(train.stops[train.stops.length - 1].time)}</div></td>
            <td><div className="cell-inner">{train.labels && train.labels.join(' / ')}</div></td>
            <td>
              <div className="cell-inner">
                <button
                  type="button"
                  data-toggle="modal"
                  data-target="#trainlist-modal"
                  className="btn btn-only-icon btn-transparent btn-color-gray pl-0"
                  onClick={() => setTrainIDX(idx)}
                >
                  <i className="icons-pencil" />
                </button>
                <button
                  type="button"
                  className="btn btn-only-icon btn-transparent btn-color-gray px-0"
                >
                  <IoMdEye />
                </button>
              </div>
            </td>
          </tr>
        );
      }
      return null;
    });
    return newFormattedList;
  };

  useEffect(() => {
    setFormattedList(formatTrainsList());
  }, [selectedTrain, simulation, filter]);

  return (
    <>
      <div className="mb-2 row">
        <div className="col-md-6 col-4">
          <span className="h2 flex-grow-2">{t('simulation:trainList')}</span>
        </div>
        <div className="col-md-6 col-8 d-flex">
          <div className="flex-grow-1">
            <InputSNCF
              type="text"
              placeholder={t('simulation:placeholderlabel')}
              id="labels-filter"
              onChange={(e) => setFilter(e.target.value)}
              onClear={() => setFilter('')}
              value={filter}
              clearButton
              noMargin
              sm
            />
          </div>
          <button
            type="button"
            className="ml-1 btn btn-primary btn-only-icon btn-sm"
            onClick={toggleTrainList}
          >
            <i className="icons-arrow-up" />
          </button>
        </div>
      </div>
      <div className="table-wrapper simulation-trainlist">
        <div className="table-scroller dragscroll">
          <table className="table table-hover">
            <thead className="thead thead-light">
              <tr>
                <th>
                  <div className="cell-inner">
                    <div className="custom-control custom-checkbox custom-checkbox-alone">
                      <input type="checkbox" className="custom-control-input" id="timetable-sel-all-trains" />
                      <label className="custom-control-label" htmlFor="timetable-sel-all-trains">
                        <span className="sr-only">Select all</span>
                      </label>
                    </div>
                  </div>
                </th>
                <th scope="col"><div className="cell-inner">{t('simulation:name')}</div></th>
                <th scope="col"><div className="cell-inner">{t('simulation:start')}</div></th>
                <th scope="col"><div className="cell-inner">{t('simulation:stop')}</div></th>
                <th scope="col"><div className="cell-inner">{t('simulation:labels')}</div></th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {formattedList !== undefined ? formattedList : null}
            </tbody>
          </table>
        </div>
      </div>
      <TrainListModal
        trainIDX={trainIDX}
      />
    </>
  );
}

TrainsList.propTypes = {
  toggleTrainList: PropTypes.func.isRequired,
};
