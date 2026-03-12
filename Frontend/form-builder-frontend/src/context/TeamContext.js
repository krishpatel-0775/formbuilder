"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
    const { user } = useAuth();
    const [teams, setTeams] = useState([]);
    const [activeTeam, setActiveTeam] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchTeams = async () => {
        if (!user) {
            setTeams([]);
            setActiveTeam(null);
            setUserRole(null);
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("http://localhost:9090/api/teams/my", { credentials: "include" });
            if (res.ok) {
                const result = await res.json();
                const myTeams = result.data || [];
                setTeams(myTeams);

                // Restore active team from localStorage or default to first team
                const savedTeamId = localStorage.getItem("activeTeamId");
                let currentTeam = myTeams.find(t => t.teamId.toString() === savedTeamId);
                
                if (!currentTeam && myTeams.length > 0) {
                    currentTeam = myTeams[0];
                }

                if (currentTeam) {
                    setActiveTeam(currentTeam.team);
                    setUserRole(currentTeam.role);
                    localStorage.setItem("activeTeamId", currentTeam.teamId);
                } else {
                    setActiveTeam(null);
                    setUserRole(null);
                }
            }
        } catch (error) {
            console.error("Failed to fetch teams", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, [user]);

    const switchTeam = (teamId) => {
        const teamMember = teams.find(t => t.teamId === teamId);
        if (teamMember) {
            setActiveTeam(teamMember.team);
            setUserRole(teamMember.role);
            localStorage.setItem("activeTeamId", teamId);
        }
    };

    const createTeam = async (name) => {
        try {
            const res = await fetch("http://localhost:9090/api/teams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
                credentials: "include"
            });
            if (res.ok) {
                await fetchTeams();
                return true;
            }
        } catch (error) {
            console.error("Failed to create team", error);
        }
        return false;
    };

    const joinTeam = async (inviteCode) => {
        try {
            const res = await fetch("http://localhost:9090/api/teams/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode }),
                credentials: "include"
            });
            if (res.ok) {
                return { success: true };
            } else {
                const msg = await res.text();
                return { success: false, message: msg || "Failed to join team" };
            }
        } catch (error) {
            console.error("Failed to join team", error);
            return { success: false, message: "Error connecting to server" };
        }
    };

    return (
        <TeamContext.Provider value={{ 
            teams, 
            activeTeam, 
            userRole, 
            loading, 
            switchTeam, 
            createTeam,
            joinTeam,
            refetchTeams: fetchTeams 
        }}>
            {children}
        </TeamContext.Provider>
    );
};

export const useTeam = () => useContext(TeamContext);
