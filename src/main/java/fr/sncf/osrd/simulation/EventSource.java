package fr.sncf.osrd.simulation;

import fr.sncf.osrd.simulation.core.Simulation;
import fr.sncf.osrd.simulation.core.SimulationError;

import java.util.ArrayList;

public class EventSource<T extends BaseT, BaseT> {
    public final ArrayList<EventSink<T, BaseT>> subscribers = new ArrayList<>();

    public void subscribe(EventSink<T, BaseT> sink) {
        assert !subscribers.contains(sink);
        subscribers.add(sink);
    }

    /**
     * Unsubscribes a sink from a source.
     * If this function fails, it's probably because you subscribed a lambda or method reference,
     * and then tried removing a similar yet not equal lambda or method reference.
     * {@code this::myMethod != this::myMethod}
     *
     * @param sink the sink to unsubscribe
     */
    public void unsubscribe(EventSink<T, BaseT> sink) throws SimulationError {
        assert subscribers.contains(sink);
        if (!subscribers.remove(sink))
            throw new SimulationError(
                    "can't unsubscribe a sink that's not in the subscribers list."
                    + " try storing your lambda or method reference in a field of your class");
    }

    /**
     * Creates a new event.
     * @param sim the simulation this events belongs to
     * @param scheduledTime the simulation time this event should happen at
     * @param value the value associated with the event
     * @return a new event
     * @throws SimulationError {@inheritDoc}
     */
    public Event<T, BaseT> event(Simulation<BaseT> sim, double scheduledTime, T value) throws SimulationError {
        return new Event<>(sim, scheduledTime, value, this);
    }
}
