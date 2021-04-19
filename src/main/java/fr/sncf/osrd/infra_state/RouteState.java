package fr.sncf.osrd.infra_state;

import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import fr.sncf.osrd.infra.TVDSection;
import fr.sncf.osrd.infra.railscript.value.RSMatchable;
import fr.sncf.osrd.infra.railscript.value.RSValue;
import fr.sncf.osrd.infra.routegraph.Route;
import fr.sncf.osrd.simulation.EntityChange;
import fr.sncf.osrd.simulation.Simulation;
import fr.sncf.osrd.utils.SortedArraySet;

/**
 * The state of the route is the actual entity which interacts with the rest of the infrastructure
 */
@SuppressFBWarnings({"URF_UNREAD_PUBLIC_OR_PROTECTED_FIELD"})
public final class RouteState implements RSMatchable {
    public final Route route;
    public RouteStatus status;
    private int movingSwitchesLeft;

    public RouteState(Route route) {
        this.route = route;
        this.status = RouteStatus.FREE;
    }

    /** Notify the route that one of his tvd section isn't occupied anymore */
    public void onTvdSectionUnoccupied(Simulation sim, TVDSectionState tvdSectionUnoccupied) {
        if (status != RouteStatus.OCCUPIED)
            return;

        // TODO This function could be optimized.
        // One way to do it is to add an attribute to tvdSection to know if they're occupied
        var tvdSectionsBehind = new SortedArraySet<TVDSection>();
        for (var tvdSectionPath : route.tvdSectionsPaths) {
            tvdSectionsBehind.add(tvdSectionPath.tvdSection);
            if (tvdSectionPath.tvdSection == tvdSectionUnoccupied.tvdSection)
                break;
        }

        for (var releaseGroup : route.releaseGroups) {
            if (!releaseGroup.contains(tvdSectionUnoccupied.tvdSection))
                continue;
            if (!tvdSectionsBehind.contains(releaseGroup))
                continue;
            for (var releasedTvdSection : releaseGroup) {
                var tvdSection = sim.infraState.getTvdSectionState(releasedTvdSection.index);
                if (tvdSection.isReserved())
                    tvdSection.free(sim);
            }
        }
    }

    /** Notify the route that one of his tvd section was freed */
    public void onTvdSectionFreed(Simulation sim) {
        if (status == RouteStatus.FREE)
            return;

        // Check that all tvd sections are free to free the route
        for (var tvdSectionPath : route.tvdSectionsPaths) {
            var tvdSection = sim.infraState.getTvdSectionState(tvdSectionPath.tvdSection.index);
            if (tvdSection.isReserved())
                return;
        }

        var change = new RouteStatusChange(sim, this, RouteStatus.FREE);
        change.apply(sim, this);
        sim.publishChange(change);
        notifySignals(sim);
    }

    /** Notify the route that one of his tvd section is reserved */
    public void onTvdSectionReserved(Simulation sim) {
        if (status != RouteStatus.FREE)
            return;
        var change = new RouteStatusChange(sim, this, RouteStatus.CONFLICT);
        change.apply(sim, this);
        sim.publishChange(change);
        notifySignals(sim);
    }

    /** Notify the route that one of his tvd section is occupied */
    public void onTvdSectionOccupied(Simulation sim) {
        if (status != RouteStatus.RESERVED)
            return;
        var change = new RouteStatusChange(sim, this, RouteStatus.OCCUPIED);
        change.apply(sim, this);
        sim.publishChange(change);
        notifySignals(sim);
    }

    private void notifySignals(Simulation sim) {
        for (var signal : route.signalSubscribers) {
            var signalState = sim.infraState.getSignalState(signal.index);
            signalState.notifyChange(sim);
        }
    }

    /** Reserve a route and his tvd sections. Routes that share tvd sections will have the status CONFLICT */
    public void reserve(Simulation sim) {
        assert status == RouteStatus.FREE;
        var change = new RouteStatusChange(sim, this, RouteStatus.REQUESTED);
        change.apply(sim, this);
        sim.publishChange(change);
        notifySignals(sim);

        // Reserve the tvd sections
        for (var tvdSectionPath : route.tvdSectionsPaths) {
            var tvdSection = sim.infraState.getTvdSectionState(tvdSectionPath.tvdSection.index);
            tvdSection.reserve(sim);
        }

        // Set the switches in the moving position
        movingSwitchesLeft = 0;
        for (var switchPos : route.switchesPosition.entrySet()) {
            var switchState = sim.infraState.getSwitchState(switchPos.getKey().switchIndex);
            boolean isMoving = switchState.requestPositionChange(sim, switchPos.getValue(), this);
            if (isMoving)
                movingSwitchesLeft++;
        }
    }

    public void notifySwitchHasMoved(Simulation sim) {
        movingSwitchesLeft--;
        if (movingSwitchesLeft == 0)
        {
            var change = new RouteStatusChange(sim, this, RouteStatus.RESERVED);
            change.apply(sim, this);
            sim.publishChange(change);
            notifySignals(sim);
        }
    }

    @Override
    public int getEnumValue() {
        return status.ordinal();
    }

    @Override
    @SuppressFBWarnings({"BC_UNCONFIRMED_CAST"})
    public boolean deepEquals(RSValue other) {
        if (other.getClass() != RouteState.class)
            return false;
        var o = (RouteState) other;
        if (route != o.route)
            return false;
        return status == o.status;
    }

    public static class RouteStatusChange extends EntityChange<RouteState, Void> {
        public final RouteStatus newStatus;
        public final int routeIndex;

        /** create a RouteStatusChange */
        public RouteStatusChange(Simulation sim, RouteState entity, RouteStatus newStatus) {
            super(sim);
            this.newStatus = newStatus;
            this.routeIndex = entity.route.index;
        }

        @Override
        public Void apply(Simulation sim, RouteState entity) {
            entity.status = newStatus;
            return null;
        }

        @Override
        public RouteState getEntity(Simulation sim) {
            return sim.infraState.getRouteState(routeIndex);
        }

        @Override
        public String toString() {
            return String.format("RouteStatusChange { route: %d, status: %s }", routeIndex, newStatus);
        }
    }
}
