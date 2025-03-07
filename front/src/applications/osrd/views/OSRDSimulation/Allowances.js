import React, { useEffect, useState } from 'react';
import { get, patch } from 'common/requests';
import { setFailure, setSuccess } from 'reducers/main.ts';
import { updateAllowancesSettings, updateMustRedraw, updateSimulation } from 'reducers/osrdsimulation';
import { useDispatch, useSelector } from 'react-redux';

import DotsLoader from 'common/DotsLoader/DotsLoader';
import { FaTrash } from 'react-icons/fa';
import InputGroupSNCF from 'common/BootstrapSNCF/InputGroupSNCF';
import InputSNCF from 'common/BootstrapSNCF/InputSNCF';
import MarecoGlobal from 'applications/osrd/components/Simulation/Allowances/MarecoGlobal';
import ModalBodySNCF from 'common/BootstrapSNCF/ModalSNCF/ModalBodySNCF';
import ModalSNCF from 'common/BootstrapSNCF/ModalSNCF/ModalSNCF';
import OPModal from 'applications/osrd/components/Simulation/Allowances/OPModal';
import PropTypes from 'prop-types';
import SelectSNCF from 'common/BootstrapSNCF/SelectSNCF';
import nextId from 'react-id-generator';
import { useTranslation } from 'react-i18next';

const trainscheduleURI = '/train_schedule/';

const TYPEUNITS = {
  time: 's',
  percentage: '%',
  time_per_distance: 'min/100km',
};

const TYPES_UNITS = {
  time: 'seconds',
  percentage: 'percentage',
  time_per_distance: 'minutes',
};

const EmptyLine = (props) => {
  const {
    allowanceTypes, allowances, setAllowances, setUpdateAllowances,
  } = props;
  const { selectedTrain } = useSelector((state) => state.osrdsimulation);
  const simulation = useSelector((state) => state.osrdsimulation.simulation.present);
  const allowanceNewDatas = {
    allowance_type: 'construction',
    begin_position: 0,
    end_position: simulation.trains[selectedTrain].base.stops[
      simulation.trains[selectedTrain].base.stops.length - 1].position,
    value: {
      value_type: 'time',
      seconds: 0,
    },
  };
  const [values, setValues] = useState(allowanceNewDatas);
  const [fromTo, setFromTo] = useState('from');
  const { t } = useTranslation(['allowances']);

  const handleType = (type) => {
    setValues({
      ...values,
      value: {
        value_type: type.type,
        [TYPES_UNITS[type.type]]: type.value === '' ? '' : parseInt(type.value, 10),
      },
    });
  };

  const handleAllowanceType = (e) => {
    setValues({
      ...values,
      allowance_type: e.target.value,
    });
  };

  const addAllowance = (allowance) => {
    if (values.begin_position < values.end_position
      && values.value[TYPES_UNITS[values.value.value_type]] > 0) {
      const newAllowances = (allowances !== null) ? Array.from(allowances) : [];
      newAllowances.push(allowance);
      setAllowances(newAllowances);
      setUpdateAllowances(true);
    }
  };

  return (
    <>
      <div className="row">
        <div className="col-md-3 d-flex align-items-center">
          <span className="mr-1">{t('from')}</span>
          <InputSNCF
            id="input-allowances-begin_position"
            type="number"
            onChange={(e) => setValues({ ...values, begin_position: parseInt(e.target.value, 10) })}
            value={values.begin_position}
            placeholder={t('begin_position')}
            unit="m"
            isInvalid={values.begin_position >= values.end_position}
            noMargin
            sm
          />
          <button
            type="button"
            className="ml-1 btn-sm btn-primary text-uppercase"
            data-toggle="modal"
            data-target="#op-input-modal"
            onClick={() => setFromTo('begin_position')}
          >
            <small>{t('op')}</small>
          </button>
        </div>
        <div className="col-md-3 d-flex align-items-center">
          <span className="mr-1">{t('to')}</span>
          <InputSNCF
            id="input-allowances-end_position"
            type="number"
            onChange={(e) => setValues({ ...values, end_position: parseInt(e.target.value, 10) })}
            value={values.end_position}
            placeholder={t('end_position')}
            unit="m"
            isInvalid={values.begin_position >= values.end_position}
            noMargin
            sm
          />
          <button
            type="button"
            className="ml-1 btn-sm btn-primary text-uppercase"
            data-toggle="modal"
            data-target="#op-input-modal"
            onClick={() => setFromTo('end_position')}
          >
            <small>{t('op')}</small>
          </button>
        </div>
        <div className="col-md-2">
          <SelectSNCF
            id="allowanceTypeSelector"
            options={[
              {
                id: 'construction',
                name: t('allowanceGlobalType.construction'),
              },
              {
                id: 'mareco',
                name: t('allowanceGlobalType.mareco'),
              },
            ]}
            labelKey="name"
            onChange={handleAllowanceType}
            sm
          />
        </div>
        <div className="col-md-3">
          <InputGroupSNCF
            id="allowanceTypesSelect"
            options={allowanceTypes}
            handleType={handleType}
            value={values.value[TYPES_UNITS[values.value.value_type]] === ''
              ? ''
              : parseInt(values.value[TYPES_UNITS[values.value.value_type]], 10)}
            sm
          />
        </div>
        <div className="col-md-1">
          <button
            type="button"
            onClick={() => addAllowance(values)}
            className={`btn btn-success btn-block btn-sm ${(
              values.begin_position >= values.end_position
              || values.value === 0 ? 'disabled' : null
            )}`}
          >
            <i className="icons-add" />
          </button>
        </div>
      </div>
      <ModalSNCF htmlID="op-input-modal">
        <ModalBodySNCF>
          <OPModal
            fromTo={fromTo}
            setValues={setValues}
            values={values}
          />
        </ModalBodySNCF>
      </ModalSNCF>
    </>
  );
};

const Allowance = (props) => {
  const { data, delAllowance, idx } = props;
  const { t } = useTranslation(['allowances']);
  const { selectedTrain } = useSelector((state) => state.osrdsimulation);
  const simulation = useSelector((state) => state.osrdsimulation.simulation.present);

  const position2name = (position) => {
    const place = simulation.trains[selectedTrain].base.stops.find(
      (element) => element.position === position,
    );
    return place && place.name !== null ? `${place.name} (${Math.round(position)}m)` : `${position}m`;
  };

  return (
    <div className="allowance-line">
      <div className="row align-items-center">
        <div className="col-md-1">
          <small>{idx + 1}</small>
        </div>
        <div className="col-md-3">
          {position2name(data.begin_position)}
        </div>
        <div className="col-md-3">
          {position2name(data.end_position)}
        </div>
        <div className="col-md-2">
          {t(`allowanceGlobalType.${data.allowance_type}`)}
          /
          {t(`allowanceTypes.${data.value.value_type}`)}
        </div>
        <div className="col-md-2 text-center">
          {data.value[TYPES_UNITS[data.value.value_type]]}
          {TYPEUNITS[data.value.value_type]}
        </div>
        <div className="col-md-1 d-flex align-items-center">
          <button
            type="button"
            className="btn btn-sm btn-only-icon btn-white text-danger"
            onClick={() => delAllowance(idx)}
          >
            <FaTrash />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Allowances(props) {
  const { toggleAllowancesDisplay } = props;
  const {
    allowancesSettings, selectedProjection, selectedTrain,
  } = useSelector((state) => state.osrdsimulation);
  const simulation = useSelector((state) => state.osrdsimulation.simulation.present);
  const [trainDetail, setTrainDetail] = useState(undefined);
  const [allowances, setAllowances] = useState([]);
  const [updateAllowances, setUpdateAllowances] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dispatch = useDispatch();
  const { t } = useTranslation(['allowances']);

  const allowanceTypes = [
    {
      id: 'time',
      label: t('allowanceTypes.time'),
      unit: TYPEUNITS.time,
    },
    {
      id: 'percentage',
      label: t('allowanceTypes.percentage'),
      unit: TYPEUNITS.percentage,
    },
    {
      id: 'time_per_distance',
      label: t('allowanceTypes.time_per_distance'),
      unit: TYPEUNITS.time_per_distance,
    },
  ];

  const getAllowances = async () => {
    try {
      setIsUpdating(true);
      const result = await get(`${trainscheduleURI}${simulation.trains[selectedTrain].id}/`);
      setTrainDetail(result);
      setAllowances(result.allowances);
      setIsUpdating(false);
    } catch (e) {
      console.log('ERROR', e);
      dispatch(setFailure({
        name: e.name,
        message: e.message,
      }));
    }
  };

  const changeAllowances = async (newAllowances) => {
    try {
      setIsUpdating(true);
      await patch(`${trainscheduleURI}${simulation.trains[selectedTrain].id}/`, {
        ...trainDetail,
        allowances: newAllowances,
      });
      const newSimulationTrains = Array.from(simulation.trains);
      newSimulationTrains[selectedTrain] = await get(`${trainscheduleURI}${simulation.trains[selectedTrain].id}/result/`,
        {
          id: simulation.trains[selectedTrain].id,
          path: selectedProjection.path,
        });

      getAllowances();
      dispatch(updateSimulation({ ...simulation, trains: newSimulationTrains }));
      dispatch(updateMustRedraw(true));
      dispatch(setSuccess({
        title: t('allowanceModified.construction'),
        text: '',
      }));
      setIsUpdating(false);
    } catch (e) {
      setIsUpdating(false);
      console.log('ERROR', e);
      dispatch(setFailure({
        name: e.name,
        message: e.request.responseText,
      }));
    }
  };

  const delAllowance = (idx) => {
    const newAllowances = Array.from(allowances);
    newAllowances.splice(idx, 1);
    if (newAllowances.length === 0) {
      const newAllowancesSettings = { ...allowancesSettings };
      dispatch(updateAllowancesSettings({
        ...newAllowancesSettings,
        [simulation.trains[selectedTrain].id]: {
          ...newAllowancesSettings[simulation.trains[selectedTrain].id],
          ecoBlocks: false,
          baseBlocks: true,
        },
      }));
    }
    setAllowances(newAllowances);
    setUpdateAllowances(true);
  };

  useEffect(() => {
    if (updateAllowances) {
      changeAllowances(allowances);
      setUpdateAllowances(false);
    }
  }, [allowances]);

  useEffect(() => {
    getAllowances();
  }, [selectedTrain]);

  return (
    <div className="osrd-simulation-container">
      {isUpdating && (
        <div className="allowances-updating-loader">
          <DotsLoader />
        </div>
      )}
      {trainDetail && trainDetail.allowances && (
        <>
          <div className="h2 d-flex">
            <MarecoGlobal
              allowanceTypes={allowanceTypes}
              getAllowances={getAllowances}
              setIsUpdating={setIsUpdating}
              trainDetail={trainDetail}
              TYPES_UNITS={TYPES_UNITS}
            />
            <button
              type="button"
              className="ml-auto btn btn-primary btn-only-icon btn-sm"
              onClick={toggleAllowancesDisplay}
            >
              <i className="icons-arrow-up" />
            </button>
          </div>
          <div>
            {t('allowanceByInterval')}
          </div>
          <div className="row my-1 small">
            <div className="col-md-1">
              n°
            </div>
            <div className="col-md-3 text-lowercase">
              {t('from')}
            </div>
            <div className="col-md-3">
              {t('to')}
            </div>
            <div className="col-md-4">
              {t('allowanceType')}
            </div>
          </div>
          {trainDetail.allowances.map((allowance, idx) => {
            if (allowance.allowance_type !== 'mareco') {
              return (
                <Allowance data={allowance} delAllowance={delAllowance} idx={idx} key={nextId()} />
              );
            }
            return null;
          })}
          <hr className="mt-0" />
        </>
      )}
      <EmptyLine
        setAllowances={setAllowances}
        setUpdateAllowances={setUpdateAllowances}
        allowances={allowances}
        allowanceTypes={allowanceTypes}
      />
    </div>
  );
}

Allowances.propTypes = {
  toggleAllowancesDisplay: PropTypes.func.isRequired,
};

Allowance.propTypes = {
  data: PropTypes.object.isRequired,
  delAllowance: PropTypes.func.isRequired,
  idx: PropTypes.number.isRequired,
};

EmptyLine.propTypes = {
  allowances: PropTypes.array,
  allowanceTypes: PropTypes.array.isRequired,
  setAllowances: PropTypes.func.isRequired,
  setUpdateAllowances: PropTypes.func.isRequired,
};
EmptyLine.defaultProps = {
  allowances: [],
};
